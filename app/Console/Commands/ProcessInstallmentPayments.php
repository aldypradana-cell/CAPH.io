<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Installment;
use App\Models\InstallmentPayment;
use App\Services\TransactionService;
use App\Enums\TransactionType;
use Illuminate\Support\Carbon;
use App\Notifications\InstallmentPaymentSuccess;
use App\Notifications\InstallmentPaymentFailed;

class ProcessInstallmentPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'installments:process';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process installment auto-debit payments';

    /**
     * Execute the console command.
     */
    public function handle(TransactionService $transactionService)
    {
        $this->info('Starting installment auto-debit processing...');

        $installments = Installment::with(['user', 'wallet'])
            ->where('auto_debit', true)
            ->where('is_completed', false)
            ->whereNotNull('wallet_id')
            ->get();

        $today = Carbon::today();
        $processedCount = 0;

        foreach ($installments as $installment) {
            $start = Carbon::parse($installment->start_date);
            // Calculate next due based on CURRENT paid_tenor + 1. If paid_tenor is 0, next is month 1.
            $monthsToAdd = $installment->paid_tenor + 1;
            
            $nextDue = $start->copy()->addMonths($monthsToAdd);
            
            if ($installment->due_day) {
                $daysInMonth = $nextDue->daysInMonth;
                $targetDay = min($installment->due_day, $daysInMonth);
                $nextDue->day($targetDay);
            }
            $nextDue->startOfDay();

            if ($today->greaterThanOrEqualTo($nextDue)) {
                $this->info("Processing Auto-Debit: {$installment->name}");

                $monthlyAmount = $installment->monthly_amount;
                // If it's the last payment, adjust for any rounding differences by paying the remaining amount exactly
                if ($installment->paid_tenor + 1 == $installment->total_tenor) {
                    $monthlyAmount = max(0, $installment->remaining_amount);
                }

                if ($monthlyAmount <= 0) continue;

                try {
                    $transactions = $transactionService->createTransactions(
                        [[
                            'wallet_id' => $installment->wallet_id,
                            'amount' => $monthlyAmount,
                            'type' => TransactionType::EXPENSE->value,
                            'category' => 'Bayar Cicilan',
                            'description' => "Bayar cicilan ke-" . ($installment->paid_tenor + 1) . " untuk " . $installment->name,
                            'date' => now()->format('Y-m-d'),
                        ]],
                        $installment->user_id,
                        $installment->wallet_id
                    );

                    $tx = $transactions[0] ?? null;

                    if ($tx) {
                        InstallmentPayment::create([
                            'installment_id' => $installment->id,
                            'transaction_id' => $tx->id,
                            'amount' => $monthlyAmount,
                            'tenor_number' => $installment->paid_tenor + 1,
                            'date' => now()->format('Y-m-d'),
                        ]);

                        $installment->paid_tenor += 1;
                        if ($installment->paid_tenor >= $installment->total_tenor) {
                            $installment->is_completed = true;
                        }
                        $installment->save();

                        $installment->user->notify(new InstallmentPaymentSuccess($installment, $monthlyAmount));
                        $this->info("Success: {$installment->name} processed.");
                        $processedCount++;
                    }
                } catch (\Exception $e) {
                    $this->error("Failed to process {$installment->name}: " . $e->getMessage());
                    // Notify user about failure (insufficient balance, etc.)
                    $installment->user->notify(new InstallmentPaymentFailed($installment));
                }
            }
        }

        $this->info("Completed processing. Processed {$processedCount} installments.");
    }
}
