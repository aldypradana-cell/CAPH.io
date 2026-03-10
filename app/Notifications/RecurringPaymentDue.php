<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RecurringPaymentDue extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $recurringTransaction, public $isFailed = false)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->line('The introduction to the notification.')
            ->action('Notification Action', url('/'))
            ->line('Thank you for using our application!');
    }

    public function toArray(object $notifiable): array
    {
        if ($this->isFailed) {
            return [
                'title' => 'Pembayaran Otomatis Gagal',
                'message' => "Sistem gagal memotong saldo untuk langganan '{$this->recurringTransaction->name}'. Pastikan saldo dompet cukup.",
                'type' => 'ALERT',
                'link' => route('recurring.index'),
            ];
        }

        return [
            'title' => 'Tagihan Langganan',
            'message' => "Tagihan '{$this->recurringTransaction->name}' sebesar Rp" . number_format($this->recurringTransaction->amount, 0, ',', '.') . " harus dibayar hari ini.",
            'type' => 'WARNING',
            'link' => route('recurring.index'),
        ];
    }
}
