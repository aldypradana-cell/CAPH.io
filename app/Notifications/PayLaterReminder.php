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
        
        if ($this->daysRemaining < 0) {
            $message = "Tagihan PayLater '{$this->installment->name}' sudah TERLAMBAT " . abs($this->daysRemaining) . " hari!";
            $alertType = 'ALERT';
        } elseif ($this->daysRemaining === 0) {
            $message = "Tagihan PayLater '{$this->installment->name}' jatuh tempo HARI INI.";
            $alertType = 'ALERT';
        } else {
            $message = "Tagihan PayLater '{$this->installment->name}' jatuh tempo dalam {$this->daysRemaining} hari.";
        }

        return [
            'title' => "Pengingat Tagihan PayLater",
            'message' => $message,
            'type' => $alertType,
            'link' => route('debts.index'),
        ];
    }
}
