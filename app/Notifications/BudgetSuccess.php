<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Budget;

class BudgetSuccess extends Notification
{
    use Queueable;

    public $budget;
    public $period;

    /**
     * Create a new notification instance.
     */
    public function __construct(Budget $budget, string $period)
    {
        $this->budget = $budget;
        $this->period = $period;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => "Target Anggaran Tercapai!",
            'message' => "Selamat! Anda berhasil menjaga pengeluaran {$this->budget->category} {$this->period} di bawah batas anggaran Anda.",
            'type' => 'SUCCESS',
            'link' => route('budgets.index'),
        ];
    }
}
