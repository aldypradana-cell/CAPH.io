<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\Category;
use App\Models\Debt;
use App\Models\Budget;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

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
        
        // --- Server-Side Aggregation for Trend Chart ---
        $trendData = $this->aggregateTrendData($user->id, $startDate, $endDate, $mode, $trendCategory);

        // --- Aggregation for Pie Chart (Expense by Category) - INDEPENDENT FILTER ---
        $pieData = Transaction::forUser($user->id)
            ->inDateRange($pieStartDate, $pieEndDate)
            ->where('type', 'EXPENSE')
            ->selectRaw('category as name, SUM(amount) as value')
            ->groupBy('category')
            ->orderByDesc('value')
            ->get()
            ->map(fn($item) => ['name' => $item->name, 'value' => (float) $item->value]);

        // --- Top 5 Expense Tags (Current Month - FIXED) ---
        $topTags = \DB::table('transaction_tag')
            ->join('transactions', 'transactions.id', '=', 'transaction_tag.transaction_id')
            ->join('tags', 'tags.id', '=', 'transaction_tag.tag_id')
            ->where('transactions.user_id', $user->id)
            ->where('transactions.type', 'EXPENSE')
            ->whereNull('transactions.deleted_at')
            ->whereBetween('transactions.date', [$fixedStartDate, $fixedEndDate])
            ->select('tags.name', 'tags.color', \DB::raw('SUM(transactions.amount) as total'))
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

        // Budget progress (Keep existing logic or optimize)
        $budgets = Budget::where('user_id', $user->id)->get();
        // ... (reuse existing budget logic, it queries inside loop but it's okay for < 20 budgets)
        $budgetProgress = $budgets->map(function ($budget) use ($user) {
             $now = Carbon::now();
             $start = $now->copy()->startOfMonth()->format('Y-m-d');
             $end = $now->copy()->endOfMonth()->format('Y-m-d');
             
             if ($budget->period === 'WEEKLY') {
                 $start = $now->copy()->startOfWeek()->format('Y-m-d');
                 $end = $now->copy()->endOfWeek()->format('Y-m-d');
             } elseif ($budget->period === 'YEARLY') {
                 $start = $now->copy()->startOfYear()->format('Y-m-d');
                 $end = $now->copy()->endOfYear()->format('Y-m-d');
             }

            $spent = Transaction::forUser($user->id)
                ->where('type', 'EXPENSE')
                ->where('category', $budget->category)
                ->inDateRange($start, $end)
                ->sum('amount');

            return [
                'id' => $budget->id,
                'category' => $budget->category,
                'limit' => $budget->limit,
                'spent' => (float) $spent,
                'percentage' => $budget->limit > 0 ? min(100, round(($spent / $budget->limit) * 100)) : 0,
            ];
        });

        // Get upcoming bills
        $upcomingBills = Debt::where('user_id', $user->id)
            ->upcoming()
            ->take(5)
            ->get();
        
        // Get user categories for standard inputs
        $categories = Category::userCategories($user->id)->get();
        $userTags = Tag::where('user_id', $user->id)->orderBy('name')->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalIncome' => $totalIncome,
                'totalExpense' => $totalExpense,
                'balance' => $balance,
                'netFlow' => $totalIncome - $totalExpense,
                'transactionCount' => $transactionCount,
            ],
            'trendData' => $trendData,
            'pieData' => $pieData, // Replaces expenseByCategory
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
                $selectKey = "DATE(date) as period_key, DATE(date) as period_start";
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
            ->orderByRaw("MIN(date) ASC");

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
