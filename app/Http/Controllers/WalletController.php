<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WalletController extends Controller
{
    public function index(Request $request)
    {
        $wallets = Wallet::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($wallet) {
                $wallet->balance = (float) $wallet->balance;
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
}
