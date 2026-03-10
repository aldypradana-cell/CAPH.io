<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SavingsController extends Controller
{
    protected $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    /**
     * Savings & Goals main page.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get all SAVING wallets with monthly cashflow
        $monthStart = now()->startOfMonth()->format('Y-m-d');
        $monthEnd = now()->endOfMonth()->format('Y-m-d');

        $savingWallets = Wallet::where('user_id', $user->id)
            ->where('type', 'SAVING')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($wallet) {
                $wallet->balance = (float) $wallet->balance;
                return $wallet;
            });

        // Monthly cashflow for each saving wallet (transfers in and out)
        $transferInByWallet = Transaction::where('user_id', $user->id)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->where('type', 'TRANSFER')
            ->whereNotNull('to_wallet_id')
            ->whereIn('to_wallet_id', $savingWallets->pluck('id'))
            ->groupBy('to_wallet_id')
            ->selectRaw('to_wallet_id, SUM(amount) as total')
            ->pluck('total', 'to_wallet_id');

        $transferOutByWallet = Transaction::where('user_id', $user->id)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->where('type', 'TRANSFER')
            ->whereIn('wallet_id', $savingWallets->pluck('id'))
            ->groupBy('wallet_id')
            ->selectRaw('wallet_id, SUM(amount) as total')
            ->pluck('total', 'wallet_id');

        $savingWallets->transform(function ($wallet) use ($transferInByWallet, $transferOutByWallet) {
            $wallet->monthly_in = (float) ($transferInByWallet[$wallet->id] ?? 0);
            $wallet->monthly_out = (float) ($transferOutByWallet[$wallet->id] ?? 0);
            return $wallet;
        });

        // Get all goals
        $goals = Goal::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Get daily wallets (non-SAVING) for topup/withdraw modals
        $dailyWallets = Wallet::where('user_id', $user->id)
            ->where('type', '!=', 'SAVING')
            ->get()
            ->map(function ($wallet) {
                $wallet->balance = (float) $wallet->balance;
                return $wallet;
            });

        return Inertia::render('Savings/Index', [
            'savingWallets' => $savingWallets,
            'goals' => $goals,
            'dailyWallets' => $dailyWallets,
        ]);
    }

    /**
     * Store a new financial goal.
     */
    public function storeGoal(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'deadline' => 'nullable|date',
            'current_amount' => 'nullable|numeric|min:0',
            'color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:50',
        ]);

        $request->user()->goals()->create($validated);

        return redirect()->back()->with('success', 'Target berhasil ditambahkan!');
    }

    /**
     * Update a financial goal.
     */
    public function updateGoal(Request $request, Goal $goal)
    {
        if ($request->user()->id !== $goal->user_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
            'deadline' => 'nullable|date',
            'current_amount' => 'nullable|numeric|min:0',
            'color' => 'nullable|string|max:50',
            'icon' => 'nullable|string|max:50',
        ]);

        $goal->update($validated);

        return redirect()->back()->with('success', 'Target berhasil diperbarui!');
    }

    /**
     * Delete a financial goal.
     */
    public function destroyGoal(Request $request, Goal $goal)
    {
        if ($request->user()->id !== $goal->user_id) {
            abort(403);
        }

        $goal->delete();

        return redirect()->back()->with('success', 'Target berhasil dihapus!');
    }

    /**
     * Top-up (transfer money from daily wallet to saving wallet).
     */
    public function topup(Request $request)
    {
        $validated = $request->validate([
            'from_wallet_id' => 'required|exists:wallets,id',
            'to_wallet_id' => 'required|exists:wallets,id',
            'amount' => 'required|numeric|min:1',
            'description' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $fromWallet = Wallet::where('user_id', $user->id)->findOrFail($validated['from_wallet_id']);
        $toWallet = Wallet::where('user_id', $user->id)->where('type', 'SAVING')->findOrFail($validated['to_wallet_id']);

        // Check balance
        if ($fromWallet->balance < $validated['amount']) {
            return redirect()->back()->withErrors(['message' => 'Saldo dompet tidak mencukupi untuk transfer ke tabungan.']);
        }

        DB::transaction(function () use ($user, $fromWallet, $toWallet, $validated) {
            // Create transfer transaction
            Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $fromWallet->id,
                'to_wallet_id' => $toWallet->id,
                'type' => 'TRANSFER',
                'amount' => $validated['amount'],
                'description' => $validated['description'] ?? 'Setor ke ' . $toWallet->name,
                'category' => 'Tabungan',
                'date' => now()->format('Y-m-d'),
            ]);

            // Update balances
            $fromWallet->decrement('balance', $validated['amount']);
            $toWallet->increment('balance', $validated['amount']);
        });

        return redirect()->back()->with('success', 'Berhasil menyetor ke tabungan!');
    }

    /**
     * Withdraw (transfer money from saving wallet to daily wallet).
     */
    public function withdraw(Request $request)
    {
        $validated = $request->validate([
            'from_wallet_id' => 'required|exists:wallets,id',
            'to_wallet_id' => 'required|exists:wallets,id',
            'amount' => 'required|numeric|min:1',
            'description' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $fromWallet = Wallet::where('user_id', $user->id)->where('type', 'SAVING')->findOrFail($validated['from_wallet_id']);
        $toWallet = Wallet::where('user_id', $user->id)->findOrFail($validated['to_wallet_id']);

        // Check balance
        if ($fromWallet->balance < $validated['amount']) {
            return redirect()->back()->withErrors(['message' => 'Saldo tabungan tidak mencukupi untuk penarikan.']);
        }

        DB::transaction(function () use ($user, $fromWallet, $toWallet, $validated) {
            // Create transfer transaction
            Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $fromWallet->id,
                'to_wallet_id' => $toWallet->id,
                'type' => 'TRANSFER',
                'amount' => $validated['amount'],
                'description' => $validated['description'] ?? 'Tarik dari ' . $fromWallet->name,
                'category' => 'Tabungan',
                'date' => now()->format('Y-m-d'),
            ]);

            // Update balances
            $fromWallet->decrement('balance', $validated['amount']);
            $toWallet->increment('balance', $validated['amount']);
        });

        return redirect()->back()->with('success', 'Berhasil menarik dari tabungan!');
    }
}
