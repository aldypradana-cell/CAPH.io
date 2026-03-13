<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InstallmentPaymentFailed extends Notification
{
    use Queueable;

    public function __construct(public $installment)
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Pembayaran Cicilan Gagal',
            'message' => "Sistem gagal memotong saldo untuk cicilan '{$this->installment->name}'. Pastikan saldo dompet cukup.",
            'type' => 'ALERT',
            'link' => route('debts.index'),
        ];
    }
}
