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
        $rawName = trim((string) ($this->installment->name ?? ''));
        $cleanName = preg_replace('/^PayLater\s*-\s*/i', '', $rawName) ?: $rawName;
        $lender = trim((string) ($this->installment->lender ?? ''));
        $isPayLater = str_starts_with(strtolower($rawName), 'paylater -')
            || str_contains(strtolower($lender), 'paylater');

        $entityLabel = $isPayLater ? 'tagihan PayLater' : 'cicilan';
        $title = $isPayLater
            ? ($lender ? "Pembayaran {$lender} Gagal" : 'Pembayaran Tagihan PayLater Gagal')
            : 'Pembayaran Cicilan Gagal';
        $displayName = $cleanName ?: ($lender ?: 'Tanpa Nama');

        return [
            'title' => $title,
            'message' => "Sistem gagal memotong saldo untuk {$entityLabel} '{$displayName}'. Pastikan saldo dompet cukup.",
            'type' => 'ALERT',
            'link' => route('debts.index'),
        ];
    }
}
