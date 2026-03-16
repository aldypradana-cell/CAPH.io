<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PayLaterReminder extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $installment, public $daysRemaining)
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
        $message = "";
        $alertType = 'WARNING';

        $rawName = trim((string) ($this->installment->name ?? ''));
        $cleanName = preg_replace('/^PayLater\s*-\s*/i', '', $rawName) ?: $rawName;
        $lender = trim((string) ($this->installment->lender ?? ''));
        $isPayLater = str_starts_with(strtolower($rawName), 'paylater -')
            || str_contains(strtolower($lender), 'paylater');

        $entityLabel = $isPayLater ? 'Tagihan PayLater' : 'Cicilan';
        $title = $isPayLater
            ? ($lender ? "Pengingat Tagihan {$lender}" : 'Pengingat Tagihan PayLater')
            : 'Pengingat Cicilan';
        $displayName = $cleanName ?: ($lender ?: 'Tanpa Nama');

        if ($this->daysRemaining < 0) {
            $message = "{$entityLabel} '{$displayName}' sudah TERLAMBAT " . abs($this->daysRemaining) . " hari!";
            $alertType = 'ALERT';
        } elseif ($this->daysRemaining === 0) {
            $message = "{$entityLabel} '{$displayName}' jatuh tempo HARI INI.";
            $alertType = 'ALERT';
        } else {
            $message = "{$entityLabel} '{$displayName}' jatuh tempo dalam {$this->daysRemaining} hari.";
        }

        return [
            'title' => $title,
            'message' => $message,
            'type' => $alertType,
            'link' => route('debts.index'),
        ];
    }
}
