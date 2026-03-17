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
use App\Traits\HasTransactionSuggestions;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use HasTransactionSuggestions;

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
        $allWallets = Wallet::where('user_id', $user->id)->get();
        $wallets = $allWallets->where('type', '!=', 'SAVING')->values();
        
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
        $balance = (float) $allWallets->sum('balance'); // Net worth uses ALL wallets including SAVING
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
                ->where(function ($q) {
                    $q->where('type', 'EXPENSE')
                      ->orWhere(function ($sub) {
                          $sub->where('type', 'TRANSFER')
                              ->where('category', 'Tabungan');
                      });
                })
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
                
                if (in_array('SAVINGS', $rules) || in_array('SAVINGS_PLUS', $rules)) {
                    $mappedCategories[] = 'Tabungan';
                }
                
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

        $walletCount = $allWallets->count();
        $hasWallet = $walletCount > 0;
        $hasInitialBalance = ((float) $allWallets->sum('balance')) > 0;
        $hasFirstTransaction = Transaction::forUser($user->id)->exists();
        $completedSetupSteps = collect([$hasWallet, $hasInitialBalance, $hasFirstTransaction])->filter()->count();

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
            'allWallets' => $allWallets,
            'upcomingBills' => $upcomingBills,
            'topTags' => $topTags,
            'categories' => $categories,
            'userTags' => $userTags,
            'suggestions' => $this->getTransactionSuggestions($user->id),
            'filters' => [
                'startDate' => $startDate,
                'endDate' => $endDate,
                'mode' => $mode,
                'trendCategory' => $trendCategory,
                'pieStartDate' => $pieStartDate,
                'pieEndDate' => $pieEndDate,
            ],
            'onboarding' => [
                'show' => !($hasWallet && $hasInitialBalance && $hasFirstTransaction),
                'completedSteps' => $completedSetupSteps,
                'progressPercent' => (int) round(($completedSetupSteps / 3) * 100),
                'steps' => [
                    [
                        'key' => 'wallet',
                        'title' => 'Buat wallet pertama',
                        'description' => 'Tempat menyimpan saldo utama Anda.',
                        'completed' => $hasWallet,
                        'active' => !$hasWallet,
                        'href' => route('wallets.index'),
                        'actionLabel' => 'Buat Wallet',
                    ],
                    [
                        'key' => 'balance',
                        'title' => 'Tambahkan saldo awal',
                        'description' => 'Isi jumlah saldo yang Anda miliki saat ini.',
                        'completed' => $hasInitialBalance,
                        'active' => $hasWallet && !$hasInitialBalance,
                        'href' => route('wallets.index'),
                        'actionLabel' => 'Isi Saldo',
                    ],
                    [
                        'key' => 'transaction',
                        'title' => 'Catat transaksi pertama',
                        'description' => 'Mulai dengan satu pemasukan atau pengeluaran.',
                        'completed' => $hasFirstTransaction,
                        'active' => $hasWallet && $hasInitialBalance && !$hasFirstTransaction,
                        'href' => route('dashboard', ['action' => 'add-transaction']),
                        'actionLabel' => 'Tambah Transaksi',
                    ],
                ],
            ],
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

    /**
     * API endpoint: Get transaction streak and daily recording status.
     */
    public function streakApi(Request $request)
    {
        $user = $request->user();
        
        $month = $request->input('month');
        $year = $request->input('year');
        
        if ($month && $year) {
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();
        } else {
            $days = (int) $request->input('days', 7);
            $endDate = Carbon::now()->endOfDay();
            $startDate = Carbon::now()->subDays($days - 1)->startOfDay();
        }
        
        // For history display (last N days)
        $historyRaw = Transaction::forUser($user->id)
            ->where('date', '>=', $startDate->format('Y-m-d'))
            ->where('date', '<=', $endDate->format('Y-m-d'))
            ->selectRaw('DISTINCT DATE(date) as d')
            ->pluck('d')
            ->map(fn($d) => (string) $d)
            ->toArray();
            
        $history = [];
        $currentDate = $startDate->copy();
        while ($currentDate->lte($endDate)) {
            $dateStr = $currentDate->format('Y-m-d');
            $history[$dateStr] = in_array($dateStr, $historyRaw);
            $currentDate->addDay();
        }
        
        // For calculating the current streak, get all distinct dates DESC as strings
        $allDatesDesc = Transaction::forUser($user->id)
            ->selectRaw('DISTINCT DATE(date) as d')
            ->orderByRaw('d DESC')
            ->pluck('d')
            ->map(fn($d) => (string) $d)
            ->toArray();
        
        $streak = 0;
        $maxStreak = 0;
        $tempStreak = 0;
        
        if (!empty($allDatesDesc)) {
            $today = Carbon::now()->format('Y-m-d');
            $yesterday = Carbon::now()->subDay()->format('Y-m-d');
            
            // Current Streak Calculation
            if (in_array($today, $allDatesDesc) || in_array($yesterday, $allDatesDesc)) {
                $checkDate = in_array($today, $allDatesDesc) ? Carbon::now() : Carbon::now()->subDay();
                foreach ($allDatesDesc as $dateStr) {
                    if ($dateStr > $today) continue;
                    if ($dateStr === $checkDate->format('Y-m-d')) {
                        $streak++;
                        $checkDate->subDay();
                    } else if ($dateStr < $checkDate->format('Y-m-d')) {
                        break;
                    }
                }
            }

            // Max Streak Calculation (Longest Gap-less Sequence)
            $sortedDates = collect($allDatesDesc)->sort()->values();
            if ($sortedDates->isNotEmpty()) {
                $tempStreak = 1;
                $maxStreak = 1;
                for ($i = 1; $i < $sortedDates->count(); $i++) {
                    $prev = Carbon::parse((string)$sortedDates[$i - 1]);
                    $curr = Carbon::parse((string)$sortedDates[$i]);
                    
                    if ($prev->addDay()->format('Y-m-d') === $curr->format('Y-m-d')) {
                        $tempStreak++;
                    } else {
                        $maxStreak = max($maxStreak, $tempStreak);
                        $tempStreak = 1;
                    }
                }
                $maxStreak = max($maxStreak, $tempStreak);
            }
        }

        return response()->json([
            'history' => $history,
            'current_streak' => $streak,
            'max_streak' => $maxStreak,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
        ]);
    }
}
