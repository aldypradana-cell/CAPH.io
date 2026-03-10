<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\RecurringTransaction;
use App\Services\TransactionService;
use Illuminate\Support\Carbon;
use App\Notifications\RecurringPaymentDue;
use App\Notifications\RecurringPaymentSuccess;

class ProcessRecurringTransactions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'recurring:process';

     /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process recurring transactions that are due today and send notifications';

    /**
     * Execute the console command.
     */
    public function handle(TransactionService $transactionService)
    {
        $this->info('Starting recurring transaction processing...');

        $dueTransactions = RecurringTransaction::with('user')->where('next_run_date', '<=', now())
            ->where('is_active', true)
            ->get();

        $count = $dueTransactions->count();
        $this->info("Found {$count} transactions due for processing.");

        foreach ($dueTransactions as $recurring) {
            try {
                if (!$recurring->auto_cut) {
                    $this->info("Manual Payment Required: {$recurring->name}");
                    $recurring->user->notify(new RecurringPaymentDue($recurring, false));
                    
                    // Update Next Run Date so it doesn't notify every day
                    $recurring->next_run_date = $recurring->calculateNextRunDate();
                    $recurring->save();
                    continue;
                }

                $this->info("Processing Auto-Cut: {$recurring->name} ({$recurring->amount})");

                // Create Transaction
                $transactionService->createTransactions(
                [[
                        'wallet_id' => $recurring->wallet_id,
                        'amount' => $recurring->amount,
                        'type' => $recurring->type,
                        'category' => $recurring->category,
                        'description' => $recurring->name . ' (Auto Recurring)',
                        'date' => now()->format('Y-m-d'),
                    ]],
                    $recurring->user_id,
                    $recurring->wallet_id
                );

                // Update Next Run Date
                $recurring->next_run_date = $recurring->calculateNextRunDate();
                $recurring->save();

                $recurring->user->notify(new RecurringPaymentSuccess($recurring));
                $this->info("Success: {$recurring->name} processed.");
            }
            catch (\Exception $e) {
                $this->error("Failed to process {$recurring->name}: " . $e->getMessage());
                if ($recurring->auto_cut) {
                    $recurring->user->notify(new RecurringPaymentDue($recurring, true));
                }
            }
        }

        $this->info('Recurring transaction processing completed.');
    }
}
