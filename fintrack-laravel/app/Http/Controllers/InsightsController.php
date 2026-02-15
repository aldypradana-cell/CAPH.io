<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
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
        ]);
    }

    /**
     * Generate AI financial advice with structured data context
     */
    public function generate(Request $request)
    {
        $user = $request->user();
        $now = Carbon::now();

        // 1. Current Month Transactions (FULL - no limit)
        $currentMonthStart = $now->copy()->startOfMonth()->format('Y-m-d');
        $currentMonthEnd = $now->copy()->endOfMonth()->format('Y-m-d');

        $currentMonthTx = Transaction::forUser($user->id)
            ->inDateRange($currentMonthStart, $currentMonthEnd)
            ->orderBy('date')
            ->get();

        if ($currentMonthTx->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada transaksi bulan ini untuk dianalisis. Tambahkan beberapa transaksi terlebih dahulu.',
            ], 422);
        }

        // Format current month detail
        $currentMonthDetail = $currentMonthTx->map(function ($t) {
            return "{$t->date->format('Y-m-d')}: {$t->type} - {$t->category} - Rp" . number_format($t->amount, 0, ',', '.') . " ({$t->description})";
        })->join("\n");

        // 2. Six Month Summary (Aggregated)
        $sixMonthSummary = '';
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = $now->copy()->subMonths($i)->startOfMonth();
            $monthEnd = $now->copy()->subMonths($i)->endOfMonth();
            $label = $monthStart->translatedFormat('M Y');

            $monthData = Transaction::forUser($user->id)
                ->inDateRange($monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d'))
                ->selectRaw('type, SUM(amount) as total')
                ->groupBy('type')
                ->pluck('total', 'type');

            $income = (float) ($monthData['INCOME'] ?? 0);
            $expense = (float) ($monthData['EXPENSE'] ?? 0);
            $rate = $income > 0 ? round((($income - $expense) / $income) * 100, 1) : 0;

            $sixMonthSummary .= "{$label}: Income Rp" . number_format($income, 0, ',', '.') . 
                ", Expense Rp" . number_format($expense, 0, ',', '.') . 
                ", Savings Rate {$rate}%\n";
        }

        // 3. Top Categories This Month
        $topCategories = Transaction::forUser($user->id)
            ->inDateRange($currentMonthStart, $currentMonthEnd)
            ->where('type', 'EXPENSE')
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $totalExpense = $topCategories->sum('total');
        $topCategoriesText = $topCategories->map(function ($c) use ($totalExpense) {
            $pct = $totalExpense > 0 ? round(($c->total / $totalExpense) * 100, 1) : 0;
            return "{$c->category}: Rp" . number_format($c->total, 0, ',', '.') . " ({$pct}%)";
        })->join("\n");

        // Build context
        $contextData = [
            'currentMonthDetail' => $currentMonthDetail,
            'sixMonthSummary' => $sixMonthSummary,
            'topCategories' => $topCategoriesText ?: 'Belum ada data pengeluaran.',
        ];

        try {
            $insight = $this->geminiService->getFinancialAdvice($user, $contextData);

            return response()->json([
                'success' => true,
                'insight' => $insight,
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
