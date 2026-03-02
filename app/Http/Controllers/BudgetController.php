<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // No eager loading — use direct SQL aggregation per budget instead
        $budgets = Budget::where('user_id', $user->id)->get();

        // Build a lookup: rule => [category_name_1, category_name_2, ...]
        $ruleCategoryNames = [];
        $allUserCategories = Category::userCategories($user->id)
            ->whereNotNull('budget_rule')
            ->get();
        foreach ($allUserCategories as $cat) {
            $ruleCategoryNames[$cat->budget_rule][] = $cat->name;
        }

        $budgetsWithProgress = $budgets->map(function ($budget) use ($user, $ruleCategoryNames) {
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

            if ($budget->is_master) {
                // Master budget: SUM all transactions whose category is mapped to this rule
                $mappedCategories = $ruleCategoryNames[$budget->category] ?? [];
                $spent = 0;
                if (!empty($mappedCategories)) {
                    $spent = Transaction::where('user_id', $user->id)
                        ->where('type', 'EXPENSE')
                        ->whereIn('category', $mappedCategories)
                        ->whereBetween('date', [$start, $end])
                        ->sum('amount');
                }
            } else {
                // Regular budget: SUM by exact category name (existing logic)
                $spent = Transaction::where('user_id', $user->id)
                    ->where('type', 'EXPENSE')
                    ->where('category', $budget->category)
                    ->whereBetween('date', [$start, $end])
                    ->sum('amount');
            }

            return [
                'id' => $budget->id,
                'category' => $budget->category,
                'limit' => $budget->limit,
                'period' => $budget->period,
                'frequency' => $budget->frequency,
                'is_master' => (bool) $budget->is_master,
                'spent' => (float) $spent,
                'remaining' => max(0, $budget->limit - $spent),
                'percentage' => $budget->limit > 0 ? min(100, round(($spent / $budget->limit) * 100)) : 0,
            ];
        });

        $categories = Category::userCategories($user->id)
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

    /**
     * Auto-generate master budgets based on a percentage template
     */
    public function autoGenerate(Request $request)
    {
        $validated = $request->validate([
            'income' => 'required|numeric|min:1',
            'template' => 'required|in:50-30-20,40-30-20-10,70-20-10',
        ]);

        $income = $validated['income'];
        $template = $validated['template'];

        // Define template allocations
        $templates = [
            '50-30-20' => [
                'NEEDS'   => 50,
                'WANTS'   => 30,
                'SAVINGS' => 20,
            ],
            '40-30-20-10' => [
                'NEEDS'       => 40,
                'WANTS'       => 30,
                'SAVINGS'     => 20,
                'INVESTMENTS' => 10,
            ],
            '70-20-10' => [
                'NEEDS'   => 70,
                'SAVINGS' => 20,
                'INVESTMENTS' => 10,
            ],
        ];

        $allocations = $templates[$template];
        $userId = $request->user()->id;

        foreach ($allocations as $rule => $percentage) {
            Budget::updateOrCreate(
                [
                    'user_id'   => $userId,
                    'category'  => $rule,
                    'is_master' => true,
                ],
                [
                    'limit'     => round($income * $percentage / 100),
                    'period'    => 'MONTHLY',
                    'frequency' => 'MONTHLY',
                ]
            );
        }

        // Clean up master budgets that are no longer in the selected template
        Budget::where('user_id', $userId)
            ->where('is_master', true)
            ->whereNotIn('category', array_keys($allocations))
            ->delete();

        return redirect()->back()->with('success', 'Auto-Budget berhasil diterapkan!');
    }

    /**
     * Get last month's total income for the user
     */
    public function getLastMonthIncome(Request $request)
    {
        $user = $request->user();
        $lastMonthStart = Carbon::now()->subMonth()->startOfMonth()->format('Y-m-d');
        $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth()->format('Y-m-d');

        $income = Transaction::where('user_id', $user->id)
            ->where('type', 'INCOME')
            ->whereBetween('date', [$lastMonthStart, $lastMonthEnd])
            ->sum('amount');

        return response()->json(['income' => (float) $income]);
    }
}