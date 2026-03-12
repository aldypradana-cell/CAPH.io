<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\User;
use App\Notifications\NewFeedbackSubmitted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class FeedbackController extends Controller
{
    /**
     * Show user's feedback list + form to submit new feedback
     */
    public function index(Request $request)
    {
        $feedbacks = Feedback::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(fn($fb) => [
                'id'          => $fb->id,
                'category'    => $fb->category,
                'subject'     => $fb->subject,
                'message'     => $fb->message,
                'status'      => $fb->status,
                'priority'    => $fb->priority,
                'admin_reply' => $fb->admin_reply,
                'replied_at'  => $fb->replied_at?->format('d M Y H:i'),
                'created_at'  => $fb->created_at->format('d M Y H:i'),
            ]);

        return Inertia::render('Feedback/Index', [
            'feedbacks' => $feedbacks,
        ]);
    }

    /**
     * Store a new feedback from user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|in:SUGGESTION,BUG,QUESTION,OTHER',
            'subject'  => 'required|string|max:255',
            'message'  => 'required|string|max:5000',
        ]);

        $feedback = Feedback::create([
            'user_id'  => $request->user()->id,
            'category' => $validated['category'],
            'subject'  => $validated['subject'],
            'message'  => $validated['message'],
            'status'   => 'OPEN',
            'priority' => 'MEDIUM',
        ]);

        $admins = User::where('role', 'ADMIN')->get();
        Notification::send($admins, new NewFeedbackSubmitted($feedback));

        return redirect()->back()->with('success', 'Feedback berhasil dikirim! Terima kasih atas masukan Anda.');
    }
}
