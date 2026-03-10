<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DebtReminder extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $debt, public $daysRemaining)
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
        $typeLabel = $this->debt->type === 'DEBT' ? 'Hutang' : 'Piutang';
        $personName = $this->debt->person_name;
        
        $message = "";
        $alertType = 'WARNING';
        
        if ($this->daysRemaining < 0) {
            $message = "{$typeLabel} dari/ke {$personName} sudah TERLAMBAT " . abs($this->daysRemaining) . " hari!";
            $alertType = 'ALERT';
        } elseif ($this->daysRemaining === 0) {
            $message = "{$typeLabel} dari/ke {$personName} jatuh tempo HARI INI.";
            $alertType = 'ALERT';
        } else {
            $message = "{$typeLabel} dari/ke {$personName} jatuh tempo dalam {$this->daysRemaining} hari.";
        }

        return [
            'title' => "Pengingat {$typeLabel}",
            'message' => $message,
            'type' => $alertType,
            'link' => route('debts.index'),
        ];
    }
}
