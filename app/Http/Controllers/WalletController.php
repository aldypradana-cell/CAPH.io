<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WalletController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $monthStart = now()->startOfMonth()->format('Y-m-d');
        $monthEnd = now()->endOfMonth()->format('Y-m-d');

        $wallets = Wallet::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($wallet) {
                $wallet->balance = (float) $wallet->balance;
                return $wallet;
            });

        // ── Monthly Cashflow per Wallet (efficient: 2 aggregate queries) ──
        // Income per wallet: INCOME transactions + TRANSFER received (to_wallet_id)
        $incomeByWallet = Transaction::where('user_id', $userId)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->where(function ($q) {
                $q->where('type', 'INCOME');
            })
            ->groupBy('wallet_id')
            ->selectRaw('wallet_id, SUM(amount) as total')
            ->pluck('total', 'wallet_id');

        // Transfer received (to_wallet_id counts as income for the receiving wallet)
        $transferInByWallet = Transaction::where('user_id', $userId)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->where('type', 'TRANSFER')
            ->whereNotNull('to_wallet_id')
            ->groupBy('to_wallet_id')
            ->selectRaw('to_wallet_id, SUM(amount) as total')
            ->pluck('total', 'to_wallet_id');

        // Expense per wallet: EXPENSE transactions + TRANSFER sent (wallet_id)
        $expenseByWallet = Transaction::where('user_id', $userId)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->where(function ($q) {
                $q->where('type', 'EXPENSE')
                  ->orWhere('type', 'TRANSFER');
            })
            ->groupBy('wallet_id')
            ->selectRaw('wallet_id, SUM(amount) as total')
            ->pluck('total', 'wallet_id');

        // Merge cashflow data into wallets
        $wallets->transform(function ($wallet) use ($incomeByWallet, $transferInByWallet, $expenseByWallet) {
            $wallet->monthly_income = (float) ($incomeByWallet[$wallet->id] ?? 0)
                                    + (float) ($transferInByWallet[$wallet->id] ?? 0);
            $wallet->monthly_expense = (float) ($expenseByWallet[$wallet->id] ?? 0);
            return $wallet;
        });
        
        return Inertia::render('Wallets/Index', [
            'wallets' => $wallets,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:CASH,BANK,E-WALLET',
            'balance' => 'required|numeric|min:0',
        ]);
        
        Wallet::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'balance' => $validated['balance'],
        ]);
        
        return redirect()->back()->with('success', 'Dompet berhasil ditambahkan');
    }

    public function update(Request $request, Wallet $wallet)
    {
        if ($request->user()->cannot('update', $wallet)) {
            abort(403);
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:CASH,BANK,E-WALLET',
            'balance' => 'required|numeric|min:0',
        ]);
        
        $wallet->update($validated);
        
        return redirect()->back()->with('success', 'Dompet berhasil diupdate');
    }

    public function destroy(Request $request, Wallet $wallet)
    {
        if ($request->user()->cannot('delete', $wallet)) {
            abort(403);
        }
        
        // Check if wallet has transactions
        if ($wallet->transactions()->count() > 0) {
            return redirect()->back()->withErrors(['message' => 'Tidak bisa menghapus dompet yang masih memiliki transaksi']);
        }
        
        $wallet->delete();
        
        return redirect()->back()->with('success', 'Dompet berhasil dihapus');
    }

    public function setPrimary(Request $request, Wallet $wallet)
    {
        if ($request->user()->cannot('update', $wallet)) {
            abort(403);
        }

        DB::transaction(function () use ($request, $wallet) {
            // Unset current primary wallet (if any) for the user
            Wallet::where('user_id', $request->user()->id)
                ->update(['is_primary' => false]);

            // Set the selected wallet as primary
            $wallet->update(['is_primary' => true]);
        });

        return redirect()->back()->with('success', $wallet->name . ' berhasil diset sebagai dompet utama');
    }
}
