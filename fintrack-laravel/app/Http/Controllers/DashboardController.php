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
        // Filter parameters
        $startDate = $request->input('startDate', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('endDate', now()->endOfMonth()->format('Y-m-d'));
        $mode = $request->input('mode', 'DAILY'); // DAILY, WEEKLY, MONTHLY
        
        // Get user wallets
        $wallets = Wallet::where('user_id', $user->id)->get();
        
        // Get recent transactions (limit 10) instead of all
        $recentTransactions = Transaction::forUser($user->id)
            ->with(['wallet', 'toWallet', 'tags'])
            ->orderBy('date', 'desc')
            ->take(10)
            ->get();
        
        // Calculate stats (Totals for current view)
        // We can optimize this to run one query for income/expense
        $statsData = Transaction::forUser($user->id)
            ->inDateRange($startDate, $endDate)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $totalIncome = (float) ($statsData['INCOME'] ?? 0);
        $totalExpense = (float) ($statsData['EXPENSE'] ?? 0);
        $balance = (float) $wallets->sum('balance'); // Current balance is always real-time from wallets
        $transactionCount = Transaction::forUser($user->id)->inDateRange($startDate, $endDate)->count();
        
        // --- Aggregation for Trend Chart ---
        $dateFormat = match($mode) {
            'MONTHLY' => '%Y-%m',
            'YEARLY' => '%Y',
            default => '%Y-%m-%d' // DAILY and WEEKLY (for now, or implement strict weekly)
        };
        
        $groupCol = 'group_date';
        $query = Transaction::forUser($user->id)
            ->inDateRange($startDate, $endDate);
            
        if ($mode === 'WEEKLY') {
            // Weekly grouping in MySQL
            $query->selectRaw("YEARWEEK(date, 1) as group_date, type, SUM(amount) as total");
        } else {
             $query->selectRaw("DATE_FORMAT(date, '$dateFormat') as group_date, type, SUM(amount) as total");
        }

        $trendQuery = $query->groupBy('group_date', 'type')
            ->orderBy('group_date')
            ->get();
            
        // Process trend data
        $groupedTrend = [];
        foreach ($trendQuery as $item) {
            $key = $item->group_date;
            if (!isset($groupedTrend[$key])) {
                $label = $key;
                if ($mode === 'DAILY') {
                    $label = Carbon::parse($key)->translatedFormat('d M');
                } elseif ($mode === 'MONTHLY') {
                     $label = Carbon::parse($key . '-01')->translatedFormat('M Y');
                } elseif ($mode === 'YEARLY') {
                    $label = $key;
                } elseif ($mode === 'WEEKLY') {
                    // key is YearWeek e.g. 202607
                    // Need to convert to label
                    $year = substr($key, 0, 4);
                    $week = substr($key, 4);
                    $date = Carbon::now()->setISODate($year, $week);
                    $label = $date->translatedFormat('d M') . ' - ' . $date->addDays(6)->translatedFormat('d M');
                }

                $groupedTrend[$key] = ['name' => $label, 'Pemasukan' => 0, 'Pengeluaran' => 0, 'date' => $key];
            }
            if ($item->type === 'INCOME') $groupedTrend[$key]['Pemasukan'] = (float) $item->total;
            if ($item->type === 'EXPENSE') $groupedTrend[$key]['Pengeluaran'] = (float) $item->total;
        }
        $trendData = array_values($groupedTrend);

        // --- Aggregation for Pie Chart (Expense by Category) ---
        $pieData = Transaction::forUser($user->id)
            ->inDateRange($startDate, $endDate)
            ->where('type', 'EXPENSE')
            ->selectRaw('category as name, SUM(amount) as value')
            ->groupBy('category')
            ->orderByDesc('value')
            ->get()
            ->map(fn($item) => ['name' => $item->name, 'value' => (float) $item->value]);

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
            'categories' => $categories,
            'userTags' => $userTags,
            'filters' => [
                'startDate' => $startDate,
                'endDate' => $endDate,
                'mode' => $mode,
            ]
        ]);
    }
}
