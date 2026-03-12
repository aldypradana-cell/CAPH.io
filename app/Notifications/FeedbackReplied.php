<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Feedback;

class FeedbackReplied extends Notification
{
    use Queueable;

    public $feedback;

    public function __construct(Feedback $feedback)
    {
        $this->feedback = $feedback;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title'   => 'Balasan Feedback',
            'message' => "Admin telah membalas feedback Anda: \"{$this->feedback->subject}\"",
            'type'    => 'INFO',
            'link'    => route('feedback.index'),
        ];
    }
}
