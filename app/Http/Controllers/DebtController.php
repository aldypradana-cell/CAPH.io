<?php

namespace App\Http\Controllers;

use App\Models\Debt;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DebtController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Debt::where('user_id', $user->id)
            ->orderByRaw('is_paid ASC')
            ->orderBy('due_date');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('is_paid', $request->status === 'paid');
        }

        $debts = $query->paginate(20);

        // Summary
        $allDebts = Debt::where('user_id', $user->id)->get();
        $summary = [
            'totalDebt' => $allDebts->where('type', 'DEBT')->where('is_paid', false)->sum('amount'),
            'totalReceivable' => $allDebts->where('type', 'RECEIVABLE')->where('is_paid', false)->sum('amount'),
            'totalBill' => $allDebts->where('type', 'BILL')->where('is_paid', false)->sum('amount'),
            'paidCount' => $allDebts->where('is_paid', true)->count(),
            'unpaidCount' => $allDebts->where('is_paid', false)->count(),
        ];

        // Fetch Recurring Transactions
        $recurring = \App\Models\RecurringTransaction::where('user_id', $user->id)
            ->with(['wallet'])
            ->orderBy('next_run_date', 'asc')
            ->get();

        // Separate active recurring items that are due (auto_cut = false)
        $dueRecurring = $recurring->filter(function ($item) {
            return $item->is_active &&
            !$item->auto_cut &&
            $item->next_run_date <= now();
        })->values();

        return Inertia::render('Debts/Index', [
            'debts' => $debts,
            'recurring' => $recurring,
            'dueRecurring' => $dueRecurring,
            'wallets' => \App\Models\Wallet::where('user_id', $user->id)->get(['id', 'name', 'balance']),
            'categories' => \App\Models\Category::userCategories($user->id)->get(['id', 'name', 'type']),
            'summary' => $summary,
            'filters' => $request->only(['type', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:DEBT,RECEIVABLE,BILL',
            'person' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'due_date' => 'nullable|date',
            'is_paid' => 'boolean',
        ]);

        Debt::create([
            'user_id' => $request->user()->id,
            ...$validated,
            'is_paid' => $validated['is_paid'] ?? false,
        ]);

        return redirect()->back()->with('success', 'Hutang/Piutang berhasil ditambahkan');
    }

    public function update(Request $request, Debt $debt)
    {
        if ($debt->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'type' => 'required|in:DEBT,RECEIVABLE,BILL',
            'person' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'due_date' => 'nullable|date',
            'is_paid' => 'boolean',
        ]);

        $debt->update($validated);

        return redirect()->back()->with('success', 'Hutang/Piutang berhasil diupdate');
    }

    public function destroy(Request $request, Debt $debt)
    {
        if ($debt->user_id !== $request->user()->id) {
            abort(403);
        }

        $debt->delete();

        return redirect()->back()->with('success', 'Hutang/Piutang berhasil dihapus');
    }

    /**
     * Toggle paid status of a debt
     */
    public function togglePaid(Request $request, Debt $debt)
    {
        if ($debt->user_id !== $request->user()->id) {
            abort(403);
        }

        $debt->update(['is_paid' => !$debt->is_paid]);

        return redirect()->back()->with('success',
            $debt->is_paid ? 'Ditandai sudah dibayar' : 'Ditandai belum dibayar'
        );
    }
}
