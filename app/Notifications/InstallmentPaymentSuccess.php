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
        $rawName = trim((string) ($this->installment->name ?? ''));
        $cleanName = preg_replace('/^PayLater\s*-\s*/i', '', $rawName) ?: $rawName;
        $lender = trim((string) ($this->installment->lender ?? ''));
        $isPayLater = str_starts_with(strtolower($rawName), 'paylater -')
            || str_contains(strtolower($lender), 'paylater');

        $entityLabel = $isPayLater ? 'tagihan PayLater' : 'cicilan';
        $title = $isPayLater
            ? ($lender ? "Pembayaran {$lender} Berhasil" : 'Pembayaran Tagihan PayLater Berhasil')
            : 'Pembayaran Cicilan Berhasil';
        $displayName = $cleanName ?: ($lender ?: 'Tanpa Nama');

        return [
            'title' => $title,
            'message' => "Sistem berhasil memotong " . number_format($this->paymentAmount, 0, ',', '.') . " untuk {$entityLabel} '{$displayName}'.",
            'type' => 'SUCCESS',
            'link' => route('debts.index'),
        ];
    }
}
