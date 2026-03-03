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
            // Pessimistic lock: cegah race condition saldo dompet
            $wallet = Wallet::where('id', $walletId)->lockForUpdate()->firstOrFail();
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
                    $wallet->refresh(); // pastikan saldo terbaru
                } elseif ($data['type'] === 'EXPENSE') {
                    $adminFee = floatval($data['admin_fee'] ?? 0);
                    $totalExpense = $data['amount'] + $adminFee;

                    $wallet->refresh();
                    if ($wallet->balance < $totalExpense) {
                        throw new \Exception("Saldo dompet \"{$wallet->name}\" tidak cukup. Saldo: Rp" . number_format($wallet->balance, 0, ',', '.') . ", Dibutuhkan: Rp" . number_format($totalExpense, 0, ',', '.'));
                    }
                    $wallet->decrement('balance', $data['amount']);
                    $this->checkBudget($transaction);

                    // Create separate admin fee expense transaction if present
                    if ($adminFee > 0) {
                        $wallet->decrement('balance', $adminFee);
                        $feeTransaction = Transaction::create([
                            'user_id' => $userId,
                            'wallet_id' => $walletId,
                            'to_wallet_id' => null,
                            'amount' => $adminFee,
                            'type' => 'EXPENSE',
                            'category' => 'Biaya Admin',
                            'description' => 'Biaya admin - ' . $data['description'],
                            'date' => $data['date'],
                        ]);
                        $newTransactions[] = $feeTransaction;
                    }
                } elseif ($data['type'] === 'TRANSFER' && isset($data['to_wallet_id'])) {
                    $adminFee = floatval($data['admin_fee'] ?? 0);
                    $adminFeeFrom = $data['admin_fee_from'] ?? 'sender';

                    // Calculate total deduction from sender
                    $senderTotal = $data['amount'] + ($adminFeeFrom === 'sender' ? $adminFee : 0);

                    $wallet->refresh();
                    if ($wallet->balance < $senderTotal) {
                        throw new \Exception("Saldo dompet \"{$wallet->name}\" tidak cukup untuk transfer. Saldo: Rp" . number_format($wallet->balance, 0, ',', '.') . ", Dibutuhkan: Rp" . number_format($senderTotal, 0, ',', '.'));
                    }
                    $wallet->decrement('balance', $data['amount']);

                    // Lock & credit receiver wallet
                    $receiverWallet = Wallet::where('id', $data['to_wallet_id'])->lockForUpdate()->firstOrFail();
                    $receiverWallet->increment('balance', $data['amount']);

                    // Handle admin fee if present
                    if ($adminFee > 0) {
                        if ($adminFeeFrom === 'sender') {
                            // Deduct admin fee from sender wallet
                            $wallet->decrement('balance', $adminFee);
                        } else {
                            // Deduct admin fee from receiver wallet
                            $receiverWallet->refresh();
                            if ($receiverWallet->balance < $adminFee) {
                                throw new \Exception("Saldo dompet \"{$receiverWallet->name}\" tidak cukup untuk biaya admin. Saldo: Rp" . number_format($receiverWallet->balance, 0, ',', '.') . ", Biaya: Rp" . number_format($adminFee, 0, ',', '.'));
                            }
                            $receiverWallet->decrement('balance', $adminFee);
                        }

                        // Create separate EXPENSE transaction for admin fee
                        $feeWalletId = $adminFeeFrom === 'sender' ? $walletId : $data['to_wallet_id'];
                        $feeTransaction = Transaction::create([
                            'user_id' => $userId,
                            'wallet_id' => $feeWalletId,
                            'to_wallet_id' => null,
                            'amount' => $adminFee,
                            'type' => 'EXPENSE',
                            'category' => 'Biaya Admin',
                            'description' => 'Biaya admin transfer ke ' . $receiverWallet->name,
                            'date' => $data['date'],
                        ]);
                        $newTransactions[] = $feeTransaction;
                    }
                }

                $newTransactions[] = $transaction;
            }

            return $newTransactions;
        });
    }

    public function updateTransaction(Transaction $transaction, array $data)
    {
        return DB::transaction(function () use ($transaction, $data) {
            // 1. Lock & revert old balance with pessimistic lock
            $oldWallet = Wallet::where('id', $transaction->wallet_id)->lockForUpdate()->firstOrFail();
            if ($transaction->type === 'INCOME') {
                $oldWallet->decrement('balance', $transaction->amount);
            } elseif ($transaction->type === 'EXPENSE') {
                $oldWallet->increment('balance', $transaction->amount);
            } elseif ($transaction->type === 'TRANSFER' && $transaction->to_wallet_id) {
                $oldWallet->increment('balance', $transaction->amount);
                Wallet::where('id', $transaction->to_wallet_id)->lockForUpdate()->firstOrFail()->decrement('balance', $transaction->amount);
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

            // 3. Lock & apply new balance
            $wallet = Wallet::where('id', $data['wallet_id'])->lockForUpdate()->firstOrFail();
            if ($data['type'] === 'INCOME') {
                $wallet->increment('balance', $data['amount']);
            } elseif ($data['type'] === 'EXPENSE') {
                if ($wallet->balance < $data['amount']) {
                    throw new \Exception("Saldo dompet \"{$wallet->name}\" tidak cukup. Saldo: Rp" . number_format($wallet->balance, 0, ',', '.') . ", Dibutuhkan: Rp" . number_format($data['amount'], 0, ',', '.'));
                }
                $wallet->decrement('balance', $data['amount']);
                $this->checkBudget($transaction);
            } elseif ($data['type'] === 'TRANSFER' && isset($data['to_wallet_id'])) {
                if ($wallet->balance < $data['amount']) {
                    throw new \Exception("Saldo dompet \"{$wallet->name}\" tidak cukup untuk transfer. Saldo: Rp" . number_format($wallet->balance, 0, ',', '.') . ", Dibutuhkan: Rp" . number_format($data['amount'], 0, ',', '.'));
                }
                $wallet->decrement('balance', $data['amount']);
                Wallet::where('id', $data['to_wallet_id'])->lockForUpdate()->firstOrFail()->increment('balance', $data['amount']);
            }

            return $transaction;
        });
    }

    public function deleteTransaction(Transaction $transaction)
    {
        return DB::transaction(function () use ($transaction) {
            // Pessimistic lock: cegah race condition saat revert saldo
            $wallet = Wallet::where('id', $transaction->wallet_id)->lockForUpdate()->firstOrFail();

            // Revert Balance
            if ($transaction->type === 'INCOME') {
                $wallet->decrement('balance', $transaction->amount);
            } elseif ($transaction->type === 'EXPENSE') {
                $wallet->increment('balance', $transaction->amount);
            } elseif ($transaction->type === 'TRANSFER' && $transaction->to_wallet_id) {
                $wallet->increment('balance', $transaction->amount);
                Wallet::where('id', $transaction->to_wallet_id)->lockForUpdate()->firstOrFail()->decrement('balance', $transaction->amount);
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
