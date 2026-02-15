<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Eager load transactions that match the budget's category and belong to the user
        // We filter by 'EXPENSE' type here as well to reduce data size
        $budgets = Budget::where('user_id', $user->id)
            ->with(['transactions' => function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->where('type', 'EXPENSE');
            }])
            ->get();

        $budgetsWithProgress = $budgets->map(function ($budget) {
            $now = Carbon::now();
            $start = null;
            $end = null;

            if ($budget->period === 'WEEKLY') {
                $start = $now->copy()->startOfWeek()->format('Y-m-d');
                $end = $now->copy()->endOfWeek()->format('Y-m-d');
            } elseif ($budget->period === 'YEARLY') {
                $start = $now->copy()->startOfYear()->format('Y-m-d');
                $end = $now->copy()->endOfYear()->format('Y-m-d');
            } else {
                // Default to MONTHLY
                $start = $now->copy()->startOfMonth()->format('Y-m-d');
                $end = $now->copy()->endOfMonth()->format('Y-m-d');
            }

            // Filter transactions eagerly loaded
            // We use filter explicitly to handle Carbon date comparison with string dates safely
            $spent = $budget->transactions->filter(function ($transaction) use ($start, $end) {
                return $transaction->date->format('Y-m-d') >= $start && 
                       $transaction->date->format('Y-m-d') <= $end;
            })->sum('amount');

            return [
                'id' => $budget->id,
                'category' => $budget->category,
                'limit' => $budget->limit,
                'period' => $budget->period,
                'frequency' => $budget->frequency,
                'spent' => (float) $spent,
                'remaining' => max(0, $budget->limit - $spent),
                'percentage' => $budget->limit > 0 ? min(100, round(($spent / $budget->limit) * 100)) : 0,
            ];
        });

        $categories = \App\Models\Category::userCategories($user->id)
            ->byType('EXPENSE')
            ->orderBy('name')
            ->get();

        return Inertia::render('Budgets/Index', [
            'budgets' => $budgetsWithProgress,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:255',
            'limit' => 'required|numeric|min:0',
            'period' => 'required|string',
            'frequency' => 'required|in:WEEKLY,MONTHLY,YEARLY',
        ]);

        Budget::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'category' => $validated['category'],
                'period' => $validated['period'],
                'frequency' => $validated['frequency'],
            ],
            [
                'limit' => $validated['limit'],
            ]
        );

        return redirect()->back()->with('success', 'Anggaran berhasil ditambahkan');
    }

    public function update(Request $request, Budget $budget)
    {
        if ($budget->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'category' => 'required|string|max:255',
            'limit' => 'required|numeric|min:0',
            'period' => 'required|string',
            'frequency' => 'required|in:WEEKLY,MONTHLY,YEARLY',
        ]);

        $budget->update($validated);

        return redirect()->back()->with('success', 'Anggaran berhasil diupdate');
    }

    public function destroy(Request $request, Budget $budget)
    {
        if ($budget->user_id !== $request->user()->id) {
            abort(403);
        }

        $budget->delete();

        return redirect()->back()->with('success', 'Anggaran berhasil dihapus');
    }
}
