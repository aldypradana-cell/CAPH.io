<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Debt;
use App\Models\Installment;
use App\Notifications\DebtReminder;
use App\Notifications\PayLaterReminder;
use Illuminate\Support\Carbon;

class SendDueReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reminders:send';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notifications for upcoming and overdue debts & installments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to send due reminders...');
        $today = Carbon::today();

        // 1. Process Debts
        $debts = Debt::with('user')->where('is_paid', false)->get();
        $debtCount = 0;

        foreach ($debts as $debt) {
            if (!$debt->due_date) continue;

            $dueDate = Carbon::parse($debt->due_date)->startOfDay();
            $daysRemaining = $today->diffInDays($dueDate, false); // false means it can be negative (overdue)

            // Notify if due today, tomorrow (H-1), in 3 days (H-3), or if overdue (every 3 days maybe? Or just once?)
            // Let's notify for: H-3, H-1, H=0, and every Day if Overdue (daysRemaining < 0)
            if (in_array($daysRemaining, [3, 1, 0]) || $daysRemaining < 0) {
                // If overdue, maybe don't spam every day? Let's say every day is fine for now, or maybe just once.
                // For simplicity, we'll notify every day if it's late.
                $debt->user->notify(new DebtReminder($debt, (int) $daysRemaining));
                $debtCount++;
            }
        }
        $this->info("Sent {$debtCount} debt reminders.");

        // 2. Process installment reminders (PayLater + cicilan biasa)
        $installments = Installment::with('user')->where('is_completed', false)->get();
        $installmentCount = 0;

        foreach ($installments as $installment) {
            // Calculate next due date
            $start = Carbon::parse($installment->start_date);
            $monthsToAdd = $installment->paid_tenor; 
            
            // Next due is start_date + monthsToAdd, adjusted for due_day
            $nextDue = $start->copy()->addMonths($monthsToAdd);
            
            // Adjust to proper due day
            if ($installment->due_day) {
                // Handle edge cases like Feb 29 or months with 30 days
                $daysInMonth = $nextDue->daysInMonth;
                $targetDay = min($installment->due_day, $daysInMonth);
                $nextDue->day($targetDay);
            }
            $nextDue->startOfDay();

            $daysRemaining = $today->diffInDays($nextDue, false);

            if (in_array($daysRemaining, [3, 1, 0]) || $daysRemaining < 0) {
                $installment->user->notify(new PayLaterReminder($installment, (int) $daysRemaining));
                $installmentCount++;
            }
        }
        $this->info("Sent {$installmentCount} installment reminders.");
        $this->info('Completed sending due reminders.');
    }
}
