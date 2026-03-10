<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Wallet;

class LowBalanceAlert extends Notification
{
    use Queueable;

    public $wallet;

    /**
     * Create a new notification instance.
     */
    public function __construct(Wallet $wallet)
    {
        $this->wallet = $wallet;
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
        $formattedBalance = 'Rp' . number_format($this->wallet->balance, 0, ',', '.');
        $formattedMin = 'Rp' . number_format($this->wallet->min_balance_alert, 0, ',', '.');
        
        return [
            'title' => "Saldo Dompet Kurang",
            'message' => "Saldo dompet {$this->wallet->name} Anda sisa {$formattedBalance} (Di bawah batas {$formattedMin}).",
            'type' => 'WARNING',
            'link' => route('transactions.index', ['wallet_id' => $this->wallet->id]),
        ];
    }
}
