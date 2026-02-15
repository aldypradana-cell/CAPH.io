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
        $mode = $request->input('mode', 'DAILY'); // DAILY, WEEKLY, MONTHLY

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
        
        // --- Raw Data for Client-Side Aggregation (Trend Chart) ---
        // User requested client-side mechanism. Returning raw transactions in range.
        $trendData = Transaction::forUser($user->id)
            ->inDateRange($startDate, $endDate)
            ->select('id', 'date', 'type', 'amount', 'category')
            ->orderBy('date')
            ->get();

        // --- Aggregation for Pie Chart (Expense by Category) - INDEPENDENT FILTER ---
        $pieData = Transaction::forUser($user->id)
            ->inDateRange($pieStartDate, $pieEndDate)
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
                'pieStartDate' => $pieStartDate,
                'pieEndDate' => $pieEndDate,
            ]
        ]);
    }
}
