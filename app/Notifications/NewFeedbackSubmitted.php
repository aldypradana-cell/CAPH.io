<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\Feedback;

class NewFeedbackSubmitted extends Notification
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
            'title'   => 'Saran & Laporan Baru',
            'message' => "{$this->feedback->user->name} mengirimkan feedback ({$this->feedback->category}): \"{$this->feedback->subject}\"",
            'type'    => 'INFO',
            'link'    => route('admin.dashboard', ['tab' => 'feedbacks']),
        ];
    }
}
