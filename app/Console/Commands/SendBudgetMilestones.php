<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Budget;
use App\Models\Transaction;
use App\Enums\TransactionType;
use Illuminate\Support\Carbon;
use App\Notifications\BudgetSuccess;
use Illuminate\Support\Facades\DB;

class SendBudgetMilestones extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'budgets:check-milestones';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cek pencapaian anggaran dan kirim notifikasi jika berhasil tidak over-budget';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Mulai mengecek pencapaian anggaran (Budget Milestones)...');
        $successCount = 0;
        $today = now();

        Budget::chunkById(100, function ($budgets) use ($today, &$successCount) {
            foreach ($budgets as $budget) {
                // Determine if today is the END of the budget period
                $isEndOfPeriod = false;
                $startDate = null;
                $endDate = null;
                $periodName = '';

                if ($budget->period === 'WEEKLY') {
                    // Check if today is Sunday (end of week)
                    if ($today->dayOfWeek === Carbon::SUNDAY) {
                        $isEndOfPeriod = true;
                        $startDate = $today->copy()->startOfWeek()->format('Y-m-d');
                        $endDate = $today->copy()->endOfWeek()->format('Y-m-d');
                        $periodName = 'Minggu ini';
                    }
                } elseif ($budget->period === 'YEARLY') {
                    // Check if today is December 31
                    if ($today->month === 12 && $today->day === 31) {
                        $isEndOfPeriod = true;
                        $startDate = $today->copy()->startOfYear()->format('Y-m-d');
                        $endDate = $today->copy()->endOfYear()->format('Y-m-d');
                        $periodName = 'Tahun ini';
                    }
                } else {
                    // Default to MONTHLY: Check if today is the last day of the month
                    if ($today->isLastOfMonth()) {
                        $isEndOfPeriod = true;
                        $startDate = $today->copy()->startOfMonth()->format('Y-m-d');
                        $endDate = $today->copy()->endOfMonth()->format('Y-m-d');
                        $periodName = 'Bulan ini';
                    }
                }

                if ($isEndOfPeriod) {
                    // Calculate total spent in this period
                    $spent = Transaction::where('user_id', $budget->user_id)
                        ->where('type', TransactionType::EXPENSE->value)
                        ->where('category', $budget->category)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->sum('amount');

                    // If spent is less than or equal to limit (and limit > 0)
                    if ($budget->limit > 0 && $spent <= $budget->limit) {
                        $budget->user->notify(new BudgetSuccess($budget, $periodName));
                        $successCount++;
                    }
                }
            }
        });

        $this->info("Selesai! Berhasil mengirim {$successCount} notifikasi pencapaian anggaran.");
    }
}
