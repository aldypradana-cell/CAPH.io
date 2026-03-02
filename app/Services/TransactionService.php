<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use App\Models\Budget;
use Illuminate\Support\Carbon;
use App\Notifications\BudgetExceeded;

class TransactionService
{
    /**
     * Create multiple transactions with wallet balance updates
     */
    public function createTransactions(array $transactionsData, int $userId, int $walletId)
    {
        return DB::transaction(function () use ($transactionsData, $userId, $walletId) {
            $wallet = Wallet::findOrFail($walletId);
            $newTransactions = [];

            foreach ($transactionsData as $data) {
                $transaction = Transaction::create([
                    'user_id' => $userId,
                    'wallet_id' => $walletId,
                    'to_wallet_id' => $data['to_wallet_id'] ?? null,
                    'amount' => $data['amount'],
                    'type' => $data['type'],
                    'category' => $data['category'],
                    'description' => $data['description'],
                    'date' => $data['date'],
                ]);

                // Update Wallet Balance
                if ($data['type'] === 'INCOME') {
                    $wallet->increment('balance', $data['amount']);
                }
                elseif ($data['type'] === 'EXPENSE') {
                    if ($wallet->balance < $data['amount']) {
                        throw new \Exception("Saldo dompet \"{$wallet->name}\" tidak cukup. Saldo: Rp" . number_format($wallet->balance, 0, ',', '.') . ", Dibutuhkan: Rp" . number_format($data['amount'], 0, ',', '.'));
                    }
                    $wallet->decrement('balance', $data['amount']);
                    $this->checkBudget($transaction);
                }
                elseif ($data['type'] === 'TRANSFER' && isset($data['to_wallet_id'])) {
                    if ($wallet->balance < $data['amount']) {
                        throw new \Exception("Saldo dompet \"{$wallet->name}\" tidak cukup untuk transfer. Saldo: Rp" . number_format($wallet->balance, 0, ',', '.') . ", Dibutuhkan: Rp" . number_format($data['amount'], 0, ',', '.'));
                    }
                    $wallet->decrement('balance', $data['amount']);
                    Wallet::where('id', $data['to_wallet_id'])->increment('balance', $data['amount']);
                }

                $newTransactions[] = $transaction;
            }

            return $newTransactions;
        });
    }

    public function updateTransaction(Transaction $transaction, array $data)
    {
        return DB::transaction(function () use ($transaction, $data) {
            // 1. Revert old balance
            if ($transaction->type === 'INCOME') {
                $transaction->wallet->decrement('balance', $transaction->amount);
            }
            elseif ($transaction->type === 'EXPENSE') {
                $transaction->wallet->increment('balance', $transaction->amount);
            }
            elseif ($transaction->type === 'TRANSFER' && $transaction->to_wallet_id) {
                $transaction->wallet->increment('balance', $transaction->amount);
                Wallet::where('id', $transaction->to_wallet_id)->decrement('balance', $transaction->amount);
            }

            // 2. Update Transaction
            $transaction->update([
                'wallet_id' => $data['wallet_id'],
                'to_wallet_id' => $data['to_wallet_id'] ?? null,
                'amount' => $data['amount'],
                'type' => $data['type'],
                'category' => $data['category'],
                'description' => $data['description'],
                'date' => $data['date'],
            ]);

            // 3. Apply new balance
            $wallet = Wallet::findOrFail($data['wallet_id']);
            if ($data['type'] === 'INCOME') {
                $wallet->increment('balance', $data['amount']);
            }
            elseif ($data['type'] === 'EXPENSE') {
                if ($wallet->balance < $data['amount']) {
                    throw new \Exception("Saldo dompet \"{$wallet->name}\" tidak cukup. Saldo: Rp" . number_format($wallet->balance, 0, ',', '.') . ", Dibutuhkan: Rp" . number_format($data['amount'], 0, ',', '.'));
                }
                $wallet->decrement('balance', $data['amount']);
                $this->checkBudget($transaction);
            }
            elseif ($data['type'] === 'TRANSFER' && isset($data['to_wallet_id'])) {
                if ($wallet->balance < $data['amount']) {
                    throw new \Exception("Saldo dompet \"{$wallet->name}\" tidak cukup untuk transfer. Saldo: Rp" . number_format($wallet->balance, 0, ',', '.') . ", Dibutuhkan: Rp" . number_format($data['amount'], 0, ',', '.'));
                }
                $wallet->decrement('balance', $data['amount']);
                Wallet::where('id', $data['to_wallet_id'])->increment('balance', $data['amount']);
            }

            return $transaction;
        });
    }

    public function deleteTransaction(Transaction $transaction)
    {
        return DB::transaction(function () use ($transaction) {
            $wallet = $transaction->wallet;

            // Revert Balance
            if ($transaction->type === 'INCOME') {
                $wallet->decrement('balance', $transaction->amount);
            }
            elseif ($transaction->type === 'EXPENSE') {
                $wallet->increment('balance', $transaction->amount);
            }
            elseif ($transaction->type === 'TRANSFER' && $transaction->to_wallet_id) {
                $wallet->increment('balance', $transaction->amount);
                Wallet::where('id', $transaction->to_wallet_id)->decrement('balance', $transaction->amount);
            }

            $transaction->delete();
        });
    }

    protected function checkBudget(Transaction $transaction)
    {
        $user = $transaction->user;
        // Find all budgets for this category (could be Weekly AND Monthly)
        $budgets = Budget::where('user_id', $user->id)
            ->where('category', $transaction->category)
            ->get();

        foreach ($budgets as $budget) {
            $date = Carbon::parse($transaction->date);
            $start = null;
            $end = null;

            if ($budget->period === 'WEEKLY') {
                $start = $date->copy()->startOfWeek()->format('Y-m-d');
                $end = $date->copy()->endOfWeek()->format('Y-m-d');
            }
            elseif ($budget->period === 'YEARLY') {
                $start = $date->copy()->startOfYear()->format('Y-m-d');
                $end = $date->copy()->endOfYear()->format('Y-m-d');
            }
            else {
                // Default to MONTHLY
                $start = $date->copy()->startOfMonth()->format('Y-m-d');
                $end = $date->copy()->endOfMonth()->format('Y-m-d');
            }

            $spent = Transaction::where('user_id', $user->id)
                ->where('type', 'EXPENSE')
                ->where('category', $transaction->category)
                ->whereBetween('date', [$start, $end])
                ->sum('amount');

            $percentage = $budget->limit > 0 ? ($spent / $budget->limit) * 100 : 0;
            $budget->percentage = round($percentage);

            if ($percentage >= 90) {
                // Determine notification type based on budget period
                $periodLabel = $budget->period === 'WEEKLY' ? 'Mingguan' : ($budget->period === 'YEARLY' ? 'Tahunan' : 'Bulanan');

                // Add period info to notification message via dynamic property or constructor
                // Actually constructor takes budget object, so let's modify budget object slightly or just rely on standard message
                // Standard message: "Pengeluaran untuk kategori 'Makan' telah mencapai..."
                // Maybe append period to category name temporarily? No that's hacky.
                // Let's just notify. The BudgetExceeded class reads $budget->percentage.
                // If we want to distinguish period in message, we should update BudgetExceeded.
                // For now, let's just trigger it.
                $user->notify(new BudgetExceeded($budget, $transaction));
            }
        }
    }
}
