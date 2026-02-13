<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Models\Category;
use App\Models\Debt;
use App\Models\Budget;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get current month date range
        $start = now()->startOfMonth()->format('Y-m-d');
        $end = now()->endOfMonth()->format('Y-m-d');
        
        // Get user wallets
        $wallets = Wallet::where('user_id', $user->id)->get();
        
        // Get transactions for current month
        $transactions = Transaction::forUser($user->id)
            ->inDateRange($start, $end)
            ->with(['wallet', 'toWallet'])
            ->orderBy('date', 'desc')
            ->get();
        
        // Calculate stats
        $totalIncome = $transactions->where('type', 'INCOME')->sum('amount');
        $totalExpense = $transactions->where('type', 'EXPENSE')->sum('amount');
        $balance = $wallets->sum('balance');
        
        // Expense by category
        $expenseByCategory = $transactions
            ->where('type', 'EXPENSE')
            ->groupBy('category')
            ->map(fn($group) => $group->sum('amount'))
            ->sortDesc()
            ->toArray();

        // Budget progress
        $budgets = Budget::where('user_id', $user->id)->get();
        $expenses = $transactions
            ->where('type', 'EXPENSE')
            ->groupBy('category')
            ->map(fn($group) => $group->sum('amount'));

        $budgetProgress = $budgets->map(function ($budget) use ($expenses) {
            $spent = $expenses->get($budget->category, 0);
            return [
                'id' => $budget->id,
                'category' => $budget->category,
                'limit' => $budget->limit,
                'spent' => $spent,
                'percentage' => $budget->limit > 0 ? min(100, round(($spent / $budget->limit) * 100)) : 0,
            ];
        });

        // Get upcoming bills
        $upcomingBills = Debt::where('user_id', $user->id)
            ->upcoming()
            ->take(5)
            ->get();
        
        // Get all transactions for chart filtering
        $allTransactions = Transaction::forUser($user->id)
            ->with(['wallet'])
            ->orderBy('date', 'desc')
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'date' => $t->date->format('Y-m-d'),
                'description' => $t->description,
                'amount' => (float) $t->amount,
                'type' => $t->type,
                'category' => $t->category,
                'wallet' => $t->wallet ? ['id' => $t->wallet->id, 'name' => $t->wallet->name] : null,
            ]);

        // Get user categories
        $categories = Category::userCategories($user->id)->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalIncome' => $totalIncome,
                'totalExpense' => $totalExpense,
                'balance' => $balance,
                'netFlow' => $totalIncome - $totalExpense,
                'transactionCount' => $transactions->count(),
            ],
            'expenseByCategory' => $expenseByCategory,
            'budgetProgress' => $budgetProgress,
            'recentTransactions' => $transactions->take(10),
            'wallets' => $wallets,
            'upcomingBills' => $upcomingBills,
            'allTransactions' => $allTransactions,
            'categories' => $categories,
        ]);
    }
}
