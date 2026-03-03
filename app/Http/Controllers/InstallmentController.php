<?php

namespace App\Http\Controllers;

use App\Models\Installment;
use App\Models\InstallmentPayment;
use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\Request;

class InstallmentController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'type'           => 'required|in:PROPERTY,VEHICLE,LOAN,GADGET,OTHER',
            'interest_type'  => 'required|in:FLAT,FLOATING,MIXED,NONE',
            'total_amount'   => 'required|numeric|min:0',
            'monthly_amount' => 'required|numeric|min:0',
            'total_tenor'    => 'required|integer|min:1',
            'paid_tenor'     => 'nullable|integer|min:0',
            'interest_rate'  => 'nullable|numeric|min:0|max:100',
            'fixed_tenor'    => 'nullable|integer|min:0',
            'due_day'        => 'required|integer|min:1|max:31',
            'start_date'     => 'required|date',
            'lender'         => 'required|string|max:255',
            'wallet_id'      => 'nullable|exists:wallets,id',
            'notes'          => 'nullable|string|max:1000',
            'auto_debit'     => 'boolean',
        ]);

        $installment = Installment::create([
            'user_id'    => $request->user()->id,
            ...$validated,
            'paid_tenor' => $validated['paid_tenor'] ?? 0,
            'auto_debit' => $validated['auto_debit'] ?? false,
        ]);

        return redirect()->back()->with('success', 'Cicilan berhasil ditambahkan');
    }

    public function update(Request $request, Installment $installment)
    {
        if ($request->user()->cannot('update', $installment)) {
            abort(403);
        }

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'type'           => 'required|in:PROPERTY,VEHICLE,LOAN,GADGET,OTHER',
            'interest_type'  => 'required|in:FLAT,FLOATING,MIXED,NONE',
            'total_amount'   => 'required|numeric|min:0',
            'monthly_amount' => 'required|numeric|min:0',
            'total_tenor'    => 'required|integer|min:1',
            'interest_rate'  => 'nullable|numeric|min:0|max:100',
            'fixed_tenor'    => 'nullable|integer|min:0',
            'due_day'        => 'required|integer|min:1|max:31',
            'start_date'     => 'required|date',
            'lender'         => 'required|string|max:255',
            'wallet_id'      => 'nullable|exists:wallets,id',
            'notes'          => 'nullable|string|max:1000',
            'auto_debit'     => 'boolean',
        ]);

        $installment->update($validated);

        return redirect()->back()->with('success', 'Cicilan berhasil diperbarui');
    }

    public function destroy(Request $request, Installment $installment)
    {
        if ($request->user()->cannot('delete', $installment)) {
            abort(403);
        }

        $installment->delete();

        return redirect()->back()->with('success', 'Cicilan berhasil dihapus');
    }

    /**
     * Pay an installment tenor
     */
    public function pay(Request $request, Installment $installment)
    {
        if ($request->user()->cannot('update', $installment)) {
            abort(403);
        }

        $validated = $request->validate([
            'amount'    => 'required|numeric|min:0',
            'wallet_id' => 'required|exists:wallets,id',
            'paid_at'   => 'required|date',
            'notes'     => 'nullable|string|max:500',
        ]);

        $nextTenor = $installment->paid_tenor + 1;

        // Create payment record
        InstallmentPayment::create([
            'installment_id' => $installment->id,
            'tenor_number'   => $nextTenor,
            'amount'         => $validated['amount'],
            'paid_at'        => $validated['paid_at'],
            'wallet_id'      => $validated['wallet_id'],
            'notes'          => $validated['notes'] ?? null,
        ]);

        // Update installment progress
        $installment->paid_tenor = $nextTenor;
        if ($nextTenor >= $installment->total_tenor) {
            $installment->is_completed = true;
        }
        $installment->save();

        // Deduct wallet balance
        $wallet = Wallet::findOrFail($validated['wallet_id']);
        $wallet->decrement('balance', $validated['amount']);

        // Create transaction record
        Transaction::create([
            'user_id'     => $request->user()->id,
            'wallet_id'   => $validated['wallet_id'],
            'category'    => 'Cicilan & Utang',
            'type'        => 'EXPENSE',
            'amount'      => $validated['amount'],
            'description' => "{$installment->name} — Angsuran ke-{$nextTenor}/{$installment->total_tenor}",
            'date'        => $validated['paid_at'],
        ]);

        $message = $installment->is_completed
            ? '🎉 Selamat! Cicilan sudah lunas!'
            : "Angsuran ke-{$nextTenor} berhasil dibayar";

        return redirect()->back()->with('success', $message);
    }
}
