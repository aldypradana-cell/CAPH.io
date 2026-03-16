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
    public function __construct(public $recurringTransaction, public $isFailed = false, public ?string $failureReason = null)
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
        
        if ($this->isFailed) {
            $baseMessage = $isIncome
                ? "Sistem gagal menambah saldo untuk jadwal pemasukan '{$this->recurringTransaction->name}'."
                : "Sistem gagal memotong saldo untuk langganan '{$this->recurringTransaction->name}'.";

            $reason = $this->failureReason ? (' Alasan: ' . $this->failureReason) : ($isIncome ? '' : ' Pastikan saldo dompet cukup.');

            return [
                'title' => $isIncome ? 'Pemasukan Otomatis Gagal' : 'Pembayaran Otomatis Gagal',
                'message' => $baseMessage . $reason,
                'type' => 'ALERT',
                'link' => route('recurring.index'),
            ];
        }

        return [
            'title' => $isIncome ? 'Pemasukan Terjadwal' : 'Tagihan Langganan',
            'message' => $isIncome 
                ? "Pemasukan '{$this->recurringTransaction->name}' sebesar {$formattedAmount} dijadwalkan hari ini. Silakan konfirmasi."
                : "Tagihan '{$this->recurringTransaction->name}' sebesar {$formattedAmount} harus dibayar hari ini.",
            'type' => 'WARNING',
            'link' => route('recurring.index'),
        ];
    }
}
