<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Budget;
use App\Models\Debt;
use App\Models\RecurringTransaction;
use App\Models\Transaction;
use App\Models\FinancialInsight;
use App\Models\Category;
use App\Models\Installment;
use App\Models\Wallet;
use App\Models\AiUsageLog;
use App\Enums\DebtType;
use App\Services\GeminiService;
use App\Services\BudgetTemplate;
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

        // Calculate weekly usage for AI Insight
        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $usedThisWeek = AiUsageLog::where('user_id', $user->id)
            ->where('feature', 'ai_insight')
            ->where('used_at', '>=', $weekStart)
            ->count();

        $nextMonday = Carbon::now()->next(Carbon::MONDAY)->startOfDay();

        return Inertia::render('Insights/Index', [
            'transactionCount' => $transactionCount,
            'hasProfile'       => !empty($user->financial_profile),
            'latestInsight'    => FinancialInsight::where('user_id', $user->id)->latest()->first(),
            'aiQuota'          => [
                'used'     => $usedThisWeek,
                'limit'    => $user->insight_limit,
                'resetsAt' => $nextMonday->toIso8601String(),
            ],
        ]);
    }

    /**
     * Generate AI financial advice with structured data context
     */
    public function generate(Request $request)
    {
        $user = $request->user();

        // Check per-user weekly quota
        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $usedThisWeek = AiUsageLog::where('user_id', $user->id)
            ->where('feature', 'ai_insight')
            ->where('used_at', '>=', $weekStart)
            ->count();

        $nextMonday = Carbon::now()->next(Carbon::MONDAY)->startOfDay();

        if ($usedThisWeek >= $user->insight_limit) {
            return response()->json([
                'success'  => false,
                'quota'    => true,
                'message'  => 'Kuota AI Insight Anda minggu ini sudah habis.',
                'used'     => $usedThisWeek,
                'limit'    => $user->insight_limit,
                'resetsAt' => $nextMonday->toIso8601String(),
            ], 429);
        }

        // Determine Analysis Period (Default: Current Month)
        $startDate = $request->input('startDate') ? Carbon::parse($request->input('startDate')) : Carbon::now()->startOfMonth();
        $endDate = $request->input('endDate') ? Carbon::parse($request->input('endDate')) : Carbon::now()->endOfMonth();

        // 1. Smart Transaction Analysis for Selected Period
        $dateFrom = $startDate->format('Y-m-d');
        $dateTo   = $endDate->format('Y-m-d');

        // Quick check: are there any transactions at all?
        $txCount = Transaction::forUser($user->id)->inDateRange($dateFrom, $dateTo)->count();

        if ($txCount === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada transaksi dalam periode ini untuk dianalisis.',
            ], 422);
        }

        // 1a. Aggregated spending patterns (category + description grouping)
        //     AI can see: "Kopi Starbucks: 15x, total Rp225.000" → spot habits
        $spendingPatterns = Transaction::forUser($user->id)
            ->inDateRange($dateFrom, $dateTo)
            ->where('type', 'EXPENSE')
            ->selectRaw('category, description, COUNT(*) as freq, SUM(amount) as total')
            ->groupBy('category', 'description')
            ->orderBy('category')
            ->orderByDesc('total')
            ->get();

        $spendingText = $spendingPatterns->groupBy('category')->map(function ($items, $category) {
            $lines = $items->map(function ($item) {
                return "  - {$item->description}: {$item->freq}x, total Rp" . number_format($item->total, 0, ',', '.');
            })->join("\n");
            $catTotal = $items->sum('total');
            return "{$category} (Total: Rp" . number_format($catTotal, 0, ',', '.') . "):\n{$lines}";
        })->join("\n");

        // 1b. Aggregated income patterns
        $incomePatterns = Transaction::forUser($user->id)
            ->inDateRange($dateFrom, $dateTo)
            ->where('type', 'INCOME')
            ->selectRaw('category, description, COUNT(*) as freq, SUM(amount) as total')
            ->groupBy('category', 'description')
            ->orderByDesc('total')
            ->get();

        $incomeText = $incomePatterns->isEmpty()
            ? "Tidak ada pemasukan di periode ini."
            : $incomePatterns->map(function ($item) {
                return "- {$item->category} / {$item->description}: {$item->freq}x, total Rp" . number_format($item->total, 0, ',', '.');
            })->join("\n");

        // 1c. Top 100 largest individual expense transactions (for specific commentary)
        $topExpenses = Transaction::forUser($user->id)
            ->with('tags')
            ->inDateRange($dateFrom, $dateTo)
            ->where('type', 'EXPENSE')
            ->orderByDesc('amount')
            ->limit(100)
            ->get();

        $topExpensesText = $topExpenses->map(function ($t) {
            $tagString = $t->tags->isNotEmpty() ? ' [Tags: ' . $t->tags->pluck('name')->join(', ') . ']' : '';
            return "{$t->date->format('Y-m-d')}: {$t->category} - Rp" . number_format($t->amount, 0, ',', '.') . " ({$t->description}){$tagString}";
        })->join("\n");

        // Combine into $periodDetail (same key used by contextData)
        $periodDetail = "=== POLA PENGELUARAN (per kategori & deskripsi) ===\n"
            . ($spendingText ?: "Tidak ada pengeluaran.") . "\n\n"
            . "=== PEMASUKAN ===\n"
            . $incomeText . "\n\n"
            . "=== TOP " . $topExpenses->count() . " PENGELUARAN TERBESAR ===\n"
            . ($topExpensesText ?: "Tidak ada pengeluaran.");

        // 2. Benchmarking (Up to 6 Months History, excluding selected period if possible)
        $benchmarkStart = $startDate->copy()->subMonths(6);
        $benchmarkEnd = $startDate->copy()->subDay();

        $sixMonthSummary = '';
        $availableMonths = 0;

        for ($i = 5; $i >= 0; $i--) {
            $monthStart = $startDate->copy()->subMonths($i + 1)->startOfMonth();
            $monthEnd = $startDate->copy()->subMonths($i + 1)->endOfMonth();

            if ($monthStart->isFuture()) continue;

            $monthData = Transaction::forUser($user->id)
                ->inDateRange($monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d'))
                ->selectRaw('type, SUM(amount) as total')
                ->groupBy('type')
                ->pluck('total', 'type');

            if ($monthData->isEmpty()) continue;
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

        // ─────────────────────────────────────────────
        // 5. NEW: Wallet Balances (Net Position)
        // ─────────────────────────────────────────────
        $wallets = Wallet::where('user_id', $user->id)->get();
        $totalWalletBalance = $wallets->sum('balance');
        $walletText = $wallets->isEmpty()
            ? "Tidak ada dompet tercatat."
            : $wallets->map(fn($w) => "- {$w->name} ({$w->type}): Rp" . number_format($w->balance, 0, ',', '.'))->join("\n");
        $walletText .= "\nTotal Saldo: Rp" . number_format($totalWalletBalance, 0, ',', '.');

        // ─────────────────────────────────────────────
        // 6. NEW: Active Debts, Receivables & Installments
        // ─────────────────────────────────────────────
        $debts = Debt::where('user_id', $user->id)->where('is_paid', false)->orderBy('due_date')->get();
        $totalDebt = $debts->where('type', DebtType::DEBT->value)->sum('amount');
        $totalReceivable = $debts->where('type', DebtType::RECEIVABLE->value)->sum('amount');
        $debtText = $debts->isEmpty()
            ? "Tidak ada utang/piutang aktif."
            : $debts->map(function ($d) {
                $due = $d->due_date ? $d->due_date->format('Y-m-d') : 'tanpa jatuh tempo';
                return "- [{$d->type}] {$d->person}: Rp" . number_format($d->amount, 0, ',', '.') . " (jatuh tempo: {$due}) - {$d->description}";
            })->join("\n");
            
        // Add Installments
        $installments = Installment::where('user_id', $user->id)
            ->whereColumn('paid_tenor', '<', 'total_tenor')
            ->get();
            
        if ($installments->isNotEmpty()) {
            $debtText .= "\n\nDaftar Cicilan Aktif:\n";
            $debtText .= $installments->map(function($i) {
                $sisa = $i->total_tenor - $i->paid_tenor;
                return "- Cicilan {$i->name}: Sisa {$sisa} bulan x Rp" . number_format($i->monthly_amount, 0, ',', '.') . "/bln";
            })->join("\n");
            $totalDebt += $installments->sum(fn($i) => ($i->total_tenor - $i->paid_tenor) * $i->monthly_amount);
        }

        $debtText .= "\n\nTotal Hutang+Cicilan: Rp" . number_format($totalDebt, 0, ',', '.') . ", Total Piutang: Rp" . number_format($totalReceivable, 0, ',', '.');

        // ─────────────────────────────────────────────
        // 7. NEW: Active Recurring Transactions (monthly commitment)
        // ─────────────────────────────────────────────
        $recurringTx = RecurringTransaction::where('user_id', $user->id)->where('is_active', true)->get();
        $frequencyMap = ['DAILY' => 30, 'WEEKLY' => 4.33, 'MONTHLY' => 1, 'YEARLY' => 1 / 12];
        $totalMonthlyCommitment = $recurringTx->sum(function ($r) use ($frequencyMap) {
            return $r->amount * ($frequencyMap[$r->frequency] ?? 1);
        });
        $recurringText = $recurringTx->isEmpty()
            ? "Tidak ada tagihan/pemasukan rutin aktif."
            : $recurringTx->map(function ($r) {
                return "- {$r->name} ({$r->type}, {$r->frequency}): Rp" . number_format($r->amount, 0, ',', '.') . " per periode";
            })->join("\n");
        $recurringText .= "\nEstimasi total komitmen rutin per bulan: Rp" . number_format($totalMonthlyCommitment, 0, ',', '.');

        // ─────────────────────────────────────────────
        // 8. NEW: Budget vs Realization for selected period
        // ─────────────────────────────────────────────
        $budgets = Budget::where('user_id', $user->id)->get();
        $budgetText = "Tidak ada budget yang ditetapkan.";
        if ($budgets->isNotEmpty()) {
            // Fix N+1 query: Aggregate all expenses for the selected period once
            $budgetExpenses = Transaction::forUser($user->id)
                ->inDateRange($startDate->format('Y-m-d'), $endDate->format('Y-m-d'))
                ->where('type', 'EXPENSE')
                ->selectRaw('category, SUM(amount) as total')
                ->groupBy('category')
                ->pluck('total', 'category');

            // Need budget_rule mapping to correctly aggregate master budgets
            $ruleCategoryNames = [];
            $allUserCategories = Category::userCategories($user->id)
                ->whereNotNull('budget_rule')
                ->get();
            foreach ($allUserCategories as $cat) {
                $ruleCategoryNames[$cat->budget_rule][] = $cat->name;
            }

            $budgetLines = $budgets->map(function ($budget) use ($budgetExpenses, $ruleCategoryNames) {
                $spent = 0;
                
                if ($budget->is_master) {
                    $rules = BudgetTemplate::SLOT_TO_RULES[$budget->category] ?? [$budget->category];
                    $mappedCategories = collect($rules)
                        ->flatMap(fn($rule) => $ruleCategoryNames[$rule] ?? [])
                        ->toArray();
                        
                    foreach ($mappedCategories as $catName) {
                        $spent += (float) ($budgetExpenses[$catName] ?? 0);
                    }
                } else {
                    $spent = (float) ($budgetExpenses[$budget->category] ?? 0);
                }
                
                $pct = $budget->limit > 0 ? round(($spent / $budget->limit) * 100, 1) : 0;
                $status = $pct >= 100 ? 'OVER BUDGET' : ($pct >= 80 ? 'HAMPIR HABIS' : 'AMAN');
                $type = $budget->is_master ? '[MASTER]' : '[KATEGORI]';
                return "- {$type} {$budget->category}: Budget Rp" . number_format($budget->limit, 0, ',', '.') . ", Realisasi Rp" . number_format($spent, 0, ',', '.') . " ({$pct}%) - {$status}";
            });
            $budgetText = $budgetLines->join("\n");
        }

        // ─────────────────────────────────────────────
        // 9. NEW: Assets
        // ─────────────────────────────────────────────
        $assets = Asset::where('user_id', $user->id)->get();
        $totalAssetValue = $assets->sum('value');
        $assetText = $assets->isEmpty()
            ? "Tidak ada aset tercatat."
            : $assets->map(fn($a) => "- {$a->name} ({$a->type}): Rp" . number_format($a->value, 0, ',', '.'))->join("\n");
        $assetText .= "\nTotal Nilai Aset: Rp" . number_format($totalAssetValue, 0, ',', '.');

        // Build context
        $contextData = [
            'todayContext'          => "Hari ini: " . Carbon::now()->translatedFormat('d F Y') . ". Periode yang dianalisis: " . $startDate->translatedFormat('d M Y') . " s/d " . $endDate->translatedFormat('d M Y') . ".",
            'currentMonthDetail'   => $periodDetail,
            'sixMonthSummary'      => $sixMonthSummary,
            'topCategories'        => $topCategoriesText ?: 'Belum ada data pengeluaran.',
            'categoryAverages'     => $categoryAverages,
            'periodLabel'          => $startDate->translatedFormat('d M') . ' - ' . $endDate->translatedFormat('d M Y'),
            'walletBalances'       => $walletText,
            'debtsReceivables'     => $debtText,
            'recurringCommitments' => $recurringText,
            'budgetVsRealization'  => $budgetText,
            'assets'               => $assetText,
        ];

        try {
            $insight = $this->geminiService->getFinancialAdvice($user, $contextData);

            // Save to database
            $storedInsight = FinancialInsight::create([
                'user_id' => $user->id,
                'content' => $insight,
            ]);

            // Log AI usage for quota tracking
            AiUsageLog::create([
                'user_id' => $user->id,
                'feature' => 'ai_insight',
                'used_at' => now(),
            ]);

            return response()->json([
                'success'  => true,
                'insight'  => $insight,
                'saved_at' => $storedInsight->created_at,
                'quota'    => [
                    'used'     => $usedThisWeek + 1,
                    'limit'    => $user->insight_limit,
                    'resetsAt' => $nextMonday->toIso8601String(),
                ],
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
            'dependents'    => 'required|integer|min:0',
            'occupation'    => 'required|in:STABLE,PRIVATE,FREELANCE',
            'goals'         => 'nullable|array',
            'goals.*.name'     => 'required|string',
            'goals.*.amount'   => 'required|numeric|min:0',
            'goals.*.deadline' => 'required|string',
        ]);

        $request->user()->update([
            'financial_profile' => $validated,
        ]);

        return redirect()->back()->with('success', 'Profil finansial berhasil diupdate');
    }
}