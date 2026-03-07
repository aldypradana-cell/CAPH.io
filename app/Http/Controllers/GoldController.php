<?php

namespace App\Http\Controllers;

use App\Models\GoldPurchase;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Enums\TransactionType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class GoldController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'grams' => 'required|numeric|min:0.001',
            'price_per_gram' => 'required|numeric|min:0',
            'purchased_at' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'wallet_id' => ['required', Rule::exists('wallets', 'id')->where('user_id', $request->user()->id)],
        ]);

        $totalCost = $validated['grams'] * $validated['price_per_gram'];

        DB::transaction(function () use ($request, $validated, $totalCost) {
            // Deduct wallet balance
            $wallet = Wallet::where('id', $validated['wallet_id'])->lockForUpdate()->firstOrFail();
            $wallet->decrement('balance', $totalCost);

            // Record transaction
            $transaction = Transaction::create([
                'user_id' => $request->user()->id,
                'wallet_id' => $validated['wallet_id'],
                'category' => 'Investasi Emas',
                'type' => TransactionType::EXPENSE->value,
                'amount' => $totalCost,
                'description' => "Pembelian Emas Antam {$validated['grams']} gr",
                'date' => $validated['purchased_at'],
            ]);

            // Save gold purchase record
            GoldPurchase::create([
                'user_id' => $request->user()->id,
                'wallet_id' => $validated['wallet_id'],
                'transaction_id' => $transaction->id,
                'grams' => $validated['grams'],
                'price_per_gram' => $validated['price_per_gram'],
                'purchased_at' => $validated['purchased_at'],
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return redirect()->back()->with('success', 'Riwayat pembelian emas berhasil ditambahkan dan saldo dompet telah dipotong.');
    }

    public function update(Request $request, GoldPurchase $gold)
    {
        if ($request->user()->id !== $gold->user_id) {
            abort(403);
        }

        $validated = $request->validate([
            'grams' => 'required|numeric|min:0.001',
            'price_per_gram' => 'required|numeric|min:0',
            'purchased_at' => 'required|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($gold, $validated) {
            $oldTotalCost = $gold->grams * $gold->price_per_gram;
            $newTotalCost = $validated['grams'] * $validated['price_per_gram'];
            $costDifference = $newTotalCost - $oldTotalCost;

            // 1. Adjust Wallet Balance if difference exists
            if ($costDifference != 0 && $gold->wallet_id) {
                $wallet = Wallet::where('id', $gold->wallet_id)->lockForUpdate()->first();
                if ($wallet) {
                    if ($costDifference > 0) {
                        // Cost increased, deduct more from wallet
                        $wallet->decrement('balance', $costDifference);
                    } else {
                        // Cost decreased, refund the difference to wallet
                        $wallet->increment('balance', abs($costDifference));
                    }
                }
            }

            // 2. Update the associated Transaction
            if ($gold->transaction_id) {
                $transaction = Transaction::find($gold->transaction_id);
                if ($transaction) {
                    $transaction->update([
                        'amount' => $newTotalCost,
                        'description' => "Pembelian Emas Antam {$validated['grams']} gr",
                        'date' => $validated['purchased_at']
                    ]);
                }
            }

            // 3. Update the GoldPurchase record
            $gold->update([
                'grams' => $validated['grams'],
                'price_per_gram' => $validated['price_per_gram'],
                'purchased_at' => $validated['purchased_at'],
                'notes' => $validated['notes'],
            ]);
        });

        return redirect()->back()->with('success', 'Detail aset Emas dan sinkronisasi Transaksi berhasil diupdate.');
    }

    public function destroy(Request $request, GoldPurchase $gold)
    {
        if ($request->user()->id !== $gold->user_id) {
            abort(403);
        }

        DB::transaction(function () use ($gold) {
            // Restore wallet balance if a transaction was associated
            if ($gold->transaction_id) {
                $transaction = Transaction::find($gold->transaction_id);
                if ($transaction && $transaction->wallet) {
                    $refundAmount = $gold->grams * $gold->price_per_gram;
                    $transaction->wallet->increment('balance', $refundAmount);
                }
                
                if ($transaction) {
                    $transaction->delete();
                }
            }

            $gold->delete();
        });

        return redirect()->back()->with('success', 'Riwayat pembelian emas dihapus dan saldo dompet dikembalikan.');
    }

    public function updatePrice(Request $request)
    {
        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
        ]);

        Cache::put('gold_price_today_' . $request->user()->id, $validated['price'], now()->addDays(30));

        return redirect()->back()->with('success', 'Harga emas hari ini berhasil diupdate');
    }
}
