<?php

namespace App\Http\Controllers;

use App\Models\Debt;
use App\Models\DebtPayment;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DebtController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Debt::where('user_id', $user->id)
            ->with(['payments.wallet'])
            ->orderByRaw('is_paid ASC')
            ->orderBy('due_date');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('is_paid', $request->status === 'paid');
        }

        // Debts paginated and mapped with computed properties
        $debts = $query->paginate(20);
        $debts->getCollection()->transform(function ($debt) {
            return array_merge($debt->toArray(), [
                'paid_amount'         => $debt->paid_amount,
                'remaining_amount'    => $debt->remaining_amount,
                'progress_percentage' => $debt->progress_percentage,
                'payments'            => $debt->payments->map(fn($p) => [
                    'id'          => $p->id,
                    'amount'      => (float) $p->amount,
                    'date'        => $p->date->format('Y-m-d'),
                    'notes'       => $p->notes,
                    'wallet_name' => $p->wallet->name ?? '-',
                ]),
            ]);
        });

        $allDebts = Debt::where('user_id', $user->id)->with('payments')->get();
        $summary = [
            'totalDebt'       => $allDebts->where('type', 'DEBT')->where('is_paid', false)->sum('remaining_amount'),
            'totalReceivable' => $allDebts->where('type', 'RECEIVABLE')->where('is_paid', false)->sum('remaining_amount'),
            'totalBill'       => $allDebts->where('type', 'BILL')->where('is_paid', false)->sum('remaining_amount'),
            'paidCount'       => $allDebts->where('is_paid', true)->count(),
            'unpaidCount'     => $allDebts->where('is_paid', false)->count(),
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

        // Fetch Installments
        $installments = \App\Models\Installment::where('user_id', $user->id)
            ->with(['wallet', 'payments'])
            ->orderByRaw('is_completed ASC')
            ->orderBy('due_day')
            ->get()
            ->map(function ($inst) {
                return [
                    ...$inst->toArray(),
                    'remaining_amount'     => $inst->remaining_amount,
                    'progress_percentage'  => $inst->progress_percentage,
                    'remaining_tenor'      => $inst->remaining_tenor,
                ];
            });

        $installmentSummary = [
            'totalRemaining'    => $installments->where('is_completed', false)->sum('remaining_amount'),
            'monthlyDue'        => $installments->where('is_completed', false)->sum('monthly_amount'),
            'activeCount'       => $installments->where('is_completed', false)->count(),
            'completedCount'    => $installments->where('is_completed', true)->count(),
        ];

        return Inertia::render('Debts/Index', [
            'debts' => $debts,
            'recurring' => $recurring,
            'dueRecurring' => $dueRecurring,
            'wallets' => \App\Models\Wallet::where('user_id', $user->id)->get(['id', 'name', 'balance']),
            'categories' => \App\Models\Category::userCategories($user->id)->get(['id', 'name', 'type']),
            'summary' => $summary,
            'installments' => $installments,
            'installmentSummary' => $installmentSummary,
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
        if ($request->user()->cannot('update', $debt)) {
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
        if ($request->user()->cannot('delete', $debt)) {
            abort(403);
        }

        $debt->delete();

        return redirect()->back()->with('success', 'Hutang/Piutang berhasil dihapus');
    }



    /**
     * Bayar / Cicil Utang — memotong saldo dompet & mencatat transaksi
     */
    public function pay(Request $request, Debt $debt)
    {
        if ($request->user()->cannot('update', $debt)) abort(403);

        $validated = $request->validate([
            'wallet_id' => 'required|exists:wallets,id',
            'amount'    => 'required|numeric|min:1',
            'date'      => 'required|date',
            'notes'     => 'nullable|string|max:255',
        ]);

        $payAmount = (float) $validated['amount'];
        $userId    = $request->user()->id;

        DB::transaction(function () use ($debt, $validated, $payAmount, $userId) {
            $wallet = Wallet::where('id', $validated['wallet_id'])
                ->where('user_id', $userId)
                ->lockForUpdate()
                ->firstOrFail();

            // Determine transaction type and category based on debt type
            if ($debt->type === 'RECEIVABLE') {
                // Piutang dibayar: uang masuk ke dompet kita
                $txType    = 'INCOME';
                $txCategory = 'Terima Piutang';
                $wallet->increment('balance', $payAmount);
            } else {
                // Utang / Bill dibayar: uang keluar dari dompet kita
                $txType    = 'EXPENSE';
                $txCategory = 'Bayar Utang';
                $wallet->decrement('balance', $payAmount);
            }

            // Ensure category exists for this user
            Category::firstOrCreate(
                ['user_id' => $userId, 'name' => $txCategory, 'type' => $txType],
                ['is_default' => false]
            );

            // Create transaction record
            $transaction = Transaction::create([
                'user_id'     => $userId,
                'wallet_id'   => $wallet->id,
                'amount'      => $payAmount,
                'type'        => $txType,
                'category'    => $txCategory,
                'description' => ($debt->type === 'RECEIVABLE' ? 'Piutang dari ' : 'Bayar utang ke ') . $debt->person,
                'date'        => $validated['date'],
            ]);

            // Record the payment
            DebtPayment::create([
                'debt_id'        => $debt->id,
                'user_id'        => $userId,
                'wallet_id'      => $wallet->id,
                'transaction_id' => $transaction->id,
                'amount'         => $payAmount,
                'date'           => $validated['date'],
                'notes'          => $validated['notes'] ?? null,
            ]);

            // Check if debt is now fully paid
            $totalPaid = $debt->fresh()->payments->sum('amount');
            if ($totalPaid >= (float) $debt->amount) {
                $debt->update(['is_paid' => true]);
            }
        });

        return redirect()->back()->with('success', 'Pembayaran berhasil dicatat!');
    }
}
