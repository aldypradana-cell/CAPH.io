<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\FinancialInsight;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class InsightsController extends Controller
{
    protected $geminiService;

    public function __construct(GeminiService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $now = Carbon::now();

        $transactionCount = Transaction::forUser($user->id)
            ->inDateRange($now->copy()->startOfMonth()->format('Y-m-d'), $now->copy()->endOfMonth()->format('Y-m-d'))
            ->count();

        return Inertia::render('Insights/Index', [
            'transactionCount' => $transactionCount,
            'hasProfile' => !empty($user->financial_profile),
            'latestInsight' => FinancialInsight::where('user_id', $user->id)->latest()->first(),
        ]);
    }

    /**
     * Generate AI financial advice with structured data context
     */
    public function generate(Request $request)
    {
        $user = $request->user();
        
        // Determine Analysis Period (Default: Current Month)
        $startDate = $request->input('startDate') ? Carbon::parse($request->input('startDate')) : Carbon::now()->startOfMonth();
        $endDate = $request->input('endDate') ? Carbon::parse($request->input('endDate')) : Carbon::now()->endOfMonth();
        
        // 1. Transaction Detail for Selected Period
        $selectedPeriodTx = Transaction::forUser($user->id)
            ->inDateRange($startDate->format('Y-m-d'), $endDate->format('Y-m-d'))
            ->orderBy('date')
            ->get();

        if ($selectedPeriodTx->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada transaksi dalam periode ini untuk dianalisis.',
            ], 422);
        }

        // Format detail
        $periodDetail = $selectedPeriodTx->map(function ($t) {
            return "{$t->date->format('Y-m-d')}: {$t->type} - {$t->category} - Rp" . number_format($t->amount, 0, ',', '.') . " ({$t->description})";
        })->join("\n");

        // 2. Benchmarking (Up to 6 Months History, excluding selected period if possible)
        // We look back 6 months from the START of the selected period
        $benchmarkStart = $startDate->copy()->subMonths(6);
        $benchmarkEnd = $startDate->copy()->subDay(); // Up to yesterday of start date

        // If user just started, this might be empty. That's fine.
        $sixMonthSummary = '';
        $availableMonths = 0;

        for ($i = 5; $i >= 0; $i--) {
            $monthStart = $startDate->copy()->subMonths($i + 1)->startOfMonth();
            $monthEnd = $startDate->copy()->subMonths($i + 1)->endOfMonth();
             
            // Skip if benchmark month is in future relative to now (impossible but safe check)
            if ($monthStart->isFuture()) continue;

            $monthData = Transaction::forUser($user->id)
                ->inDateRange($monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d'))
                ->selectRaw('type, SUM(amount) as total')
                ->groupBy('type')
                ->pluck('total', 'type');

            if ($monthData->isEmpty()) continue; // Skip empty months for average calculation? 
            // Better to include 0 if user existed but didn't spend? 
            // For now, let's look for active months to avoid skewing average with 0s from before registration.
            $availableMonths++;

            $income = (float) ($monthData['INCOME'] ?? 0);
            $expense = (float) ($monthData['EXPENSE'] ?? 0);
            $rate = $income > 0 ? round((($income - $expense) / $income) * 100, 1) : 0;

            $sixMonthSummary .= "{$monthStart->translatedFormat('M Y')}: Income Rp" . number_format($income, 0, ',', '.') . 
                ", Expense Rp" . number_format($expense, 0, ',', '.') . 
                ", Savings Rate {$rate}%\n";
        }
        
        if ($availableMonths === 0) {
            $sixMonthSummary = "Belum ada data historis (Pengguna Baru). Gunakan data periode ini sebagai baseline awal.";
        }

        // 3. Top Categories (Selected Period)
        $topCategories = Transaction::forUser($user->id)
            ->inDateRange($startDate->format('Y-m-d'), $endDate->format('Y-m-d'))
            ->where('type', 'EXPENSE')
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $totalExpense = $topCategories->sum('total');
        $topCategoriesText = $topCategories->map(function ($c) use ($totalExpense) {
            $pct = $totalExpense > 0 ? round(($c->total / $totalExpense) * 100, 1) : 0;
            return "- {$c->category}: Rp" . number_format($c->total, 0, ',', '.') . " ({$pct}%)";
        })->join("\n");

        // 4. Category Averages (Benchmark)
        // Dynamic: If only 2 months history, divide by 2.
        $categoryAverages = '';
        if ($availableMonths > 0) {
            $categoryAveragesRaw = Transaction::forUser($user->id)
                ->inDateRange($benchmarkStart->format('Y-m-d'), $benchmarkEnd->format('Y-m-d'))
                ->where('type', 'EXPENSE')
                ->selectRaw('category, SUM(amount) as total_hist')
                ->groupBy('category')
                ->having('total_hist', '>', 0)
                ->get();
            
            $categoryAverages = $categoryAveragesRaw->map(function ($c) use ($availableMonths) {
                $avg = $c->total_hist / $availableMonths;
                return "- {$c->category}: Rata-rata Rp" . number_format($avg, 0, ',', '.') . "/bulan (Basis {$availableMonths} bln)";
            })->join("\n");
        } else {
             $categoryAverages = "Belum ada data historis.";
        }

        // Build context
        $contextData = [
            'currentMonthDetail' => $periodDetail,
            'sixMonthSummary' => $sixMonthSummary,
            'topCategories' => $topCategoriesText ?: 'Belum ada data pengeluaran.',
            'categoryAverages' => $categoryAverages,
            'periodLabel' => $startDate->translatedFormat('d M') . ' - ' . $endDate->translatedFormat('d M Y'),
        ];

        try {
            $insight = $this->geminiService->getFinancialAdvice($user, $contextData);

            // Save to database
            $storedInsight = FinancialInsight::create([
                'user_id' => $user->id,
                'content' => $insight,
            ]);

            return response()->json([
                'success' => true,
                'insight' => $insight,
                'saved_at' => $storedInsight->created_at,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghasilkan analisis. ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update user financial profile
     */
    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'maritalStatus' => 'required|in:SINGLE,MARRIED',
            'dependents' => 'required|integer|min:0',
            'occupation' => 'required|in:STABLE,PRIVATE,FREELANCE',
            'goals' => 'nullable|array',
            'goals.*.name' => 'required|string',
            'goals.*.amount' => 'required|numeric|min:0',
            'goals.*.deadline' => 'required|string',
        ]);

        $request->user()->update([
            'financial_profile' => $validated,
        ]);

        return redirect()->back()->with('success', 'Profil finansial berhasil diupdate');
    }
}
