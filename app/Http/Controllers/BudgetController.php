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
    /**
     * Slot key → array of budget_rule values that should be aggregated
     */
    private const SLOT_TO_RULES = [
        'NEEDS'        => ['NEEDS'],
        'WANTS'        => ['WANTS'],
        'SAVINGS'      => ['SAVINGS'],
        'DEBT'         => ['DEBT'],
        'SOCIAL'       => ['SOCIAL'],
        'LIVING'       => ['NEEDS', 'WANTS'],              // 70-20-10
        'SAVINGS_PLUS' => ['SAVINGS', 'DEBT', 'SOCIAL'],   // 50-30-20
        'OBLIGATIONS'  => ['DEBT', 'SOCIAL'],              // 70-20-10
    ];

    /**
     * Template definitions: slot key → percentage
     */
    private const TEMPLATES = [
        '50-30-20' => [
            'NEEDS'        => 50,
            'WANTS'        => 30,
            'SAVINGS_PLUS' => 20,
        ],
        '40-30-20-10' => [
            'NEEDS'   => 40,
            'DEBT'    => 30,
            'SAVINGS' => 20,
            'SOCIAL'  => 10,
        ],
        '70-20-10' => [
            'LIVING'      => 70,
            'SAVINGS'     => 20,
            'OBLIGATIONS' => 10,
        ],
    ];

    /**
     * Labels per slot per template
     */
    private const TEMPLATE_LABELS = [
        '50-30-20' => [
            'NEEDS'        => 'Kebutuhan',
            'WANTS'        => 'Keinginan',
            'SAVINGS_PLUS' => 'Tabungan & Kewajiban',
        ],
        '40-30-20-10' => [
            'NEEDS'   => 'Kebutuhan',
            'DEBT'    => 'Cicilan & Kewajiban',
            'SAVINGS' => 'Tabungan & Investasi',
            'SOCIAL'  => 'Sosial & Kebaikan',
        ],
        '70-20-10' => [
            'LIVING'      => 'Biaya Hidup',
            'SAVINGS'     => 'Tabungan & Investasi',
            'OBLIGATIONS' => 'Kewajiban & Sosial',
        ],
    ];

    /**
     * Detect active template from the combination of master budget slot keys
     */
    private static function detectTemplate(array $masterSlots): ?string
    {
        foreach (self::TEMPLATES as $key => $slots) {
            $templateSlots = array_keys($slots);
            sort($templateSlots);
            $current = $masterSlots;
            sort($current);
            if ($templateSlots === $current) {
                return $key;
            }
        }
        return null;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        
        $budgets = Budget::where('user_id', $user->id)->get();

        // Build a lookup: rule => [category_name_1, category_name_2, ...]
        $ruleCategoryNames = [];
        $allUserCategories = Category::userCategories($user->id)
            ->whereNotNull('budget_rule')
            ->get();
        foreach ($allUserCategories as $cat) {
            $ruleCategoryNames[$cat->budget_rule][] = $cat->name;
        }

        // Detect active template
        $masterSlots = $budgets->where('is_master', true)->pluck('category')->toArray();
        $activeTemplate = self::detectTemplate($masterSlots);
        $labels = $activeTemplate ? (self::TEMPLATE_LABELS[$activeTemplate] ?? []) : [];

        $budgetsWithProgress = $budgets->map(function ($budget) use ($user, $ruleCategoryNames, $labels) {
            $now = Carbon::now();

            if ($budget->period === 'WEEKLY') {
                $start = $now->copy()->startOfWeek()->format('Y-m-d');
                $end = $now->copy()->endOfWeek()->format('Y-m-d');
            } elseif ($budget->period === 'YEARLY') {
                $start = $now->copy()->startOfYear()->format('Y-m-d');
                $end = $now->copy()->endOfYear()->format('Y-m-d');
            } else {
                $start = $now->copy()->startOfMonth()->format('Y-m-d');
                $end = $now->copy()->endOfMonth()->format('Y-m-d');
            }

            if ($budget->is_master) {
                // Use SLOT_TO_RULES to find which budget_rules this slot aggregates
                $rules = self::SLOT_TO_RULES[$budget->category] ?? [$budget->category];
                $mappedCategories = collect($rules)
                    ->flatMap(fn($rule) => $ruleCategoryNames[$rule] ?? [])
                    ->toArray();
                
                $spent = 0;
                if (!empty($mappedCategories)) {
                    $spent = Transaction::where('user_id', $user->id)
                        ->where('type', 'EXPENSE')
                        ->whereIn('category', $mappedCategories)
                        ->whereBetween('date', [$start, $end])
                        ->sum('amount');
                }
            } else {
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
                'template_label' => $labels[$budget->category] ?? null,
            ];
        });

        $categories = Category::userCategories($user->id)
            ->byType('EXPENSE')
            ->orderBy('name')
            ->get();

        return Inertia::render('Budgets/Index', [
            'budgets' => $budgetsWithProgress,
            'categories' => $categories,
            'activeTemplate' => $activeTemplate,
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

        $budget = Budget::withTrashed()
            ->where('user_id', $request->user()->id)
            ->where('category', $validated['category'])
            ->where('period', $validated['period'])
            ->first();

        if ($budget instanceof Budget) {
            $budget->limit = $validated['limit'];
            $budget->frequency = $validated['frequency'];
            $budget->is_master = false;
            if ($budget->trashed()) {
                $budget->restore();
            }
            $budget->save();
        } else {
            Budget::create([
                'user_id' => $request->user()->id,
                'category' => $validated['category'],
                'period' => $validated['period'],
                'limit' => $validated['limit'],
                'frequency' => $validated['frequency'],
                'is_master' => false,
            ]);
        }

        return redirect()->back()->with('success', 'Anggaran berhasil ditambahkan');
    }

    public function update(Request $request, Budget $budget)
    {
        if ($request->user()->cannot('update', $budget)) {
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
        if ($request->user()->cannot('delete', $budget)) {
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
        $allocations = self::TEMPLATES[$template];
        $userId = $request->user()->id;

        foreach ($allocations as $slot => $percentage) {
            $budget = Budget::withTrashed()
                ->where('user_id', $userId)
                ->where('category', $slot)
                ->where('period', 'MONTHLY')
                ->first();

            $limit = round($income * $percentage / 100);

            if ($budget instanceof Budget) {
                $budget->limit = $limit;
                $budget->frequency = 'MONTHLY';
                $budget->is_master = true;
                if ($budget->trashed()) {
                    $budget->restore();
                }
                $budget->save();
            } else {
                Budget::create([
                    'user_id'   => $userId,
                    'category'  => $slot,
                    'period'    => 'MONTHLY',
                    'limit'     => $limit,
                    'frequency' => 'MONTHLY',
                    'is_master' => true,
                ]);
            }
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