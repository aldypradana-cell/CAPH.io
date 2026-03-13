<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InstallmentPaymentSuccess extends Notification
{
    use Queueable;

    public function __construct(public $installment, public $paymentAmount)
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
            'title' => 'Pembayaran Cicilan Sukses',
            'message' => "Sistem berhasil memotong " . number_format($this->paymentAmount, 0, ',', '.') . " untuk cicilan '{$this->installment->name}'.",
            'type' => 'SUCCESS',
            'link' => route('debts.index'),
        ];
    }
}
