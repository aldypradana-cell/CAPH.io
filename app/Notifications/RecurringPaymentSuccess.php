<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RecurringPaymentSuccess extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $recurringTransaction)
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
        $isIncome = $this->recurringTransaction->type === 'INCOME';
        $formattedAmount = "Rp" . number_format($this->recurringTransaction->amount, 0, ',', '.');

        return [
            'title' => $isIncome ? 'Pemasukan Rutin Berhasil' : 'Pembayaran Langganan Sukses',
            'message' => $isIncome 
                ? "Sistem berhasil menambahkan {$formattedAmount} dari pemasukan '{$this->recurringTransaction->name}'."
                : "Sistem berhasil memotong {$formattedAmount} untuk langganan '{$this->recurringTransaction->name}'.",
            'type' => 'SUCCESS',
            'link' => route('recurring.index'),
        ];
    }
}
