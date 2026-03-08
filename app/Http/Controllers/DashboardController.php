<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\Asset;
use App\Enums\DebtType;
use App\Models\Category;
use App\Models\Debt;
use App\Models\Installment;
use App\Models\Budget;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Services\BudgetTemplate;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        // Filter parameters for Trend/Stats
        $startDate = $request->input('startDate', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('endDate', now()->endOfMonth()->format('Y-m-d'));
        $mode = $request->input('mode', 'DAILY'); // DAILY, WEEKLY, MONTHLY, YEARLY
        $trendCategory = $request->input('trendCategory', 'ALL');

        // Filter parameters for Pie Chart (Independent)
        $pieStartDate = $request->input('pieStartDate', $startDate);
        $pieEndDate = $request->input('pieEndDate', $endDate);
        
        // Get user wallets
        $wallets = Wallet::where('user_id', $user->id)->get();
        
        // Get recent transactions (limit 10) instead of all
        $recentTransactions = Transaction::forUser($user->id)
            ->with(['wallet', 'toWallet', 'tags'])
            ->orderBy('date', 'desc')
            ->take(10)
            ->get();
        
        // Calculate stats (Totals for Current Month - FIXED)
        // User requested these to be fixed and not affected by filters
        $fixedStartDate = Carbon::now()->startOfMonth()->format('Y-m-d');
        $fixedEndDate = Carbon::now()->endOfMonth()->format('Y-m-d');

        $statsData = Transaction::forUser($user->id)
            ->inDateRange($fixedStartDate, $fixedEndDate)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $totalIncome = (float) ($statsData['INCOME'] ?? 0);
        $totalExpense = (float) ($statsData['EXPENSE'] ?? 0);
        $balance = (float) $wallets->sum('balance'); // Current balance is always real-time from wallets
        $transactionCount = Transaction::forUser($user->id)->inDateRange($fixedStartDate, $fixedEndDate)->count();
        
        // --- Net Worth Calculation ---
        $debtStats = Debt::where('user_id', $user->id)
            ->where('is_paid', false)
            ->withSum('payments', 'amount')
            ->get()
            ->groupBy('type');
            
        $totalReceivables = $debtStats->get(DebtType::RECEIVABLE->value, collect())
            ->sum(fn($d) => max(0, (float) $d->amount - (float) ($d->payments_sum_amount ?? 0)));
            
        $totalDebts = $debtStats->get(DebtType::DEBT->value, collect())
            ->sum(fn($d) => max(0, (float) $d->amount - (float) ($d->payments_sum_amount ?? 0)));
            
        $totalAssetsValue = (float) Asset::where('user_id', $user->id)->sum('value');

        // Sum up total remaining amounts of active installments
        // FIXED: Eager load payments to ensure accurate remaining_amount calculation
        $activeInstallments = Installment::where('user_id', $user->id)
            ->where('is_completed', false)
            ->with(['payments'])
            ->get();
        
        $totalInstallmentDebts = 0;
        foreach ($activeInstallments as $installment) {
            $totalInstallmentDebts += (float) $installment->remaining_amount;
        }
        
        $netWorth = ($balance + $totalReceivables + $totalAssetsValue) - ($totalDebts + $totalInstallmentDebts);

        // NOTE: trendData and pieData are now loaded lazily via trendApi() and pieApi()
        // to reduce initial page load time. Frontend fetches them via axios after render.

        // --- Top 5 Expense Tags (Current Month - FIXED) ---
        $topTags = \Illuminate\Support\Facades\DB::table('transaction_tag')
            ->join('transactions', 'transactions.id', '=', 'transaction_tag.transaction_id')
            ->join('tags', 'tags.id', '=', 'transaction_tag.tag_id')
            ->where('transactions.user_id', $user->id)
            ->where('transactions.type', 'EXPENSE')
            ->whereNull('transactions.deleted_at')
            ->whereBetween('transactions.date', [$fixedStartDate, $fixedEndDate])
            ->select('tags.name', 'tags.color', \Illuminate\Support\Facades\DB::raw('SUM(transactions.amount) as total'))
            ->groupBy('tags.name', 'tags.color')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'total' => (float) $item->total,
                'color' => $item->color,
                'percentage' => $totalExpense > 0 ? round(($item->total / $totalExpense) * 100, 1) : 0,
            ]);

        // Budget progress — using SLOT_TO_RULES from BudgetController
        $budgets = Budget::where('user_id', $user->id)->get();

        // Build rule → category names lookup for master budgets
        $ruleCategoryNames = [];
        $allUserCategories = Category::userCategories($user->id)
            ->whereNotNull('budget_rule')
            ->get();
        foreach ($allUserCategories as $cat) {
            $ruleCategoryNames[$cat->budget_rule][] = $cat->name;
        }

        // Slot → rules mapping (from shared BudgetTemplate)
        $slotToRules = BudgetTemplate::SLOT_TO_RULES;

        // Detect active template and get labels
        $masterSlots = $budgets->where('is_master', true)->pluck('category')->toArray();
        $activeTemplate = BudgetTemplate::detectTemplate($masterSlots);
        $labels = BudgetTemplate::getLabels($activeTemplate);

        // --- FIX N+1: Pre-compute expense totals per period (max 3 queries) ---
        $now = Carbon::now();
        $periodRanges = [
            'WEEKLY'  => [$now->copy()->startOfWeek()->format('Y-m-d'), $now->copy()->endOfWeek()->format('Y-m-d')],
            'MONTHLY' => [$now->copy()->startOfMonth()->format('Y-m-d'), $now->copy()->endOfMonth()->format('Y-m-d')],
            'YEARLY'  => [$now->copy()->startOfYear()->format('Y-m-d'), $now->copy()->endOfYear()->format('Y-m-d')],
        ];

        $usedPeriods = $budgets->pluck('period')->unique()->toArray();
        // Default to MONTHLY if no period field (legacy budgets)
        if (empty($usedPeriods)) {
            $usedPeriods = ['MONTHLY'];
        }
        $expenseByPeriod = [];

        foreach ($usedPeriods as $period) {
            $range = $periodRanges[$period] ?? $periodRanges['MONTHLY'];
            $expenseByPeriod[$period] = Transaction::forUser($user->id)
                ->where('type', 'EXPENSE')
                ->inDateRange($range[0], $range[1])
                ->selectRaw('category, SUM(amount) as total')
                ->groupBy('category')
                ->pluck('total', 'category')
                ->toArray();
        }

        $budgetProgress = $budgets->map(function ($budget) use ($expenseByPeriod, $ruleCategoryNames, $slotToRules, $labels) {
            $period = $budget->period ?? 'MONTHLY';
            $categoryExpenses = $expenseByPeriod[$period] ?? ($expenseByPeriod['MONTHLY'] ?? []);

            if ($budget->is_master) {
                $rules = $slotToRules[$budget->category] ?? [$budget->category];
                $mappedCategories = collect($rules)
                    ->flatMap(fn($rule) => $ruleCategoryNames[$rule] ?? [])
                    ->toArray();
                
                $spent = 0;
                foreach ($mappedCategories as $cat) {
                    $spent += (float) ($categoryExpenses[$cat] ?? 0);
                }
            } else {
                $spent = (float) ($categoryExpenses[$budget->category] ?? 0);
            }

            return [
                'id' => $budget->id,
                'category' => $budget->category,
                'limit' => $budget->limit,
                'spent' => $spent,
                'percentage' => $budget->limit > 0 ? min(100, round(($spent / $budget->limit) * 100)) : 0,
                'is_master' => (bool) $budget->is_master,
                'template_label' => $labels[$budget->category] ?? null,
            ];
        });

        // Get upcoming bills and append computed properties
        $upcomingBills = Debt::where('user_id', $user->id)
            ->upcoming()
            ->with('payments')
            ->take(5)
            ->get()
            ->map(function ($debt) {
                // Must convert to array and append computed properties manually
                // as Inertia won't serialize the accessors otherwise.
                return [
                    ...$debt->toArray(),
                    'remaining_amount' => $debt->remaining_amount,
                    'progress_percentage' => $debt->progress_percentage
                ];
            });
        
        $categories = Category::userCategories($user->id)->get();
        $userTags = Tag::where('user_id', $user->id)->orderBy('name')->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalIncome' => $totalIncome,
                'totalExpense' => $totalExpense,
                'balance' => $balance,
                'netFlow' => $totalIncome - $totalExpense,
                'transactionCount' => $transactionCount,
                'netWorth' => $netWorth,
            ],
            'trendData' => [], // Lazy-loaded via /api/dashboard/trend
            'pieData' => [],   // Lazy-loaded via /api/dashboard/pie
            'budgetProgress' => $budgetProgress,
            'recentTransactions' => $recentTransactions,
            'wallets' => $wallets,
            'upcomingBills' => $upcomingBills,
            'topTags' => $topTags,
            'categories' => $categories,
            'userTags' => $userTags,
            'filters' => [
                'startDate' => $startDate,
                'endDate' => $endDate,
                'mode' => $mode,
                'trendCategory' => $trendCategory,
                'pieStartDate' => $pieStartDate,
                'pieEndDate' => $pieEndDate,
            ]
        ]);
    }

    /**
     * API endpoint: Lazy-load trend chart data.
     */
    public function trendApi(Request $request)
    {
        $user = $request->user();
        $startDate = $request->input('startDate', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('endDate', now()->endOfMonth()->format('Y-m-d'));
        $mode = $request->input('mode', 'DAILY');
        $trendCategory = $request->input('trendCategory', 'ALL');

        return response()->json([
            'trendData' => $this->aggregateTrendData($user->id, $startDate, $endDate, $mode, $trendCategory),
            'filters' => compact('startDate', 'endDate', 'mode', 'trendCategory'),
        ]);
    }

    /**
     * API endpoint: Lazy-load pie chart data.
     */
    public function pieApi(Request $request)
    {
        $user = $request->user();
        $pieStartDate = $request->input('pieStartDate', now()->startOfMonth()->format('Y-m-d'));
        $pieEndDate = $request->input('pieEndDate', now()->endOfMonth()->format('Y-m-d'));

        $pieData = Transaction::forUser($user->id)
            ->inDateRange($pieStartDate, $pieEndDate)
            ->where('type', 'EXPENSE')
            ->selectRaw('category as name, SUM(amount) as value')
            ->groupBy('category')
            ->orderByDesc('value')
            ->get()
            ->map(fn($item) => ['name' => $item->name, 'value' => (float) $item->value]);

        return response()->json([
            'pieData' => $pieData,
        ]);
    }

    /**
     * Aggregate trend data server-side using SQL GROUP BY.
     * Returns pre-computed chart data: [ { name, Pemasukan, Pengeluaran } ]
     */
    private function aggregateTrendData(int $userId, string $startDate, string $endDate, string $mode, string $trendCategory): array
    {
        // Determine GROUP BY expression and sort key based on mode
        switch ($mode) {
            case 'WEEKLY':
                $groupBy = "YEARWEEK(date, 1)"; // ISO week (Monday start)
                $selectKey = "YEARWEEK(date, 1) as period_key, MIN(date) as period_start";
                break;
            case 'MONTHLY':
                $groupBy = "DATE_FORMAT(date, '%Y-%m')";
                $selectKey = "DATE_FORMAT(date, '%Y-%m') as period_key, MIN(date) as period_start";
                break;
            case 'YEARLY':
                $groupBy = "YEAR(date)";
                $selectKey = "YEAR(date) as period_key, MIN(date) as period_start";
                break;
            default: // DAILY
                $groupBy = "DATE(date)";
                $selectKey = "DATE(date) as period_key, MIN(date) as period_start";
                break;
        }

        $query = Transaction::forUser($userId)
            ->inDateRange($startDate, $endDate)
            ->selectRaw("
                {$selectKey},
                SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as pemasukan,
                SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as pengeluaran
            ")
            ->groupByRaw($groupBy)
            ->orderByRaw("{$groupBy} ASC");

        // Optional category filter
        if ($trendCategory !== 'ALL') {
            $query->where('category', $trendCategory);
        }

        $results = $query->get();

        // Indonesian month abbreviations
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        return $results->map(function ($row) use ($mode, $months) {
            $date = Carbon::parse($row->period_start);

            switch ($mode) {
                case 'WEEKLY':
                    $weekStart = $date->copy()->startOfWeek(Carbon::MONDAY);
                    $weekEnd = $weekStart->copy()->addDays(6);
                    if ($weekStart->month === $weekEnd->month) {
                        $name = $weekStart->day . '-' . $weekEnd->day . ' ' . $months[$weekStart->month - 1];
                    } else {
                        $name = $weekStart->day . ' ' . $months[$weekStart->month - 1] . '-' . $weekEnd->day . ' ' . $months[$weekEnd->month - 1];
                    }
                    break;
                case 'MONTHLY':
                    $name = $months[$date->month - 1] . " '" . $date->format('y');
                    break;
                case 'YEARLY':
                    $name = (string) $date->year;
                    break;
                default: // DAILY
                    $name = $date->day . ' ' . $months[$date->month - 1];
                    break;
            }

            return [
                'name' => $name,
                'Pemasukan' => (float) $row->pemasukan,
                'Pengeluaran' => (float) $row->pengeluaran,
            ];
        })->values()->toArray();
    }
}
