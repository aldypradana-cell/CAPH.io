<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\SystemLog;
use App\Notifications\FeedbackReplied;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class FeedbackController extends Controller
{
    /**
     * List all feedbacks (paginated, filterable) for admin panel
     */
    public function index(Request $request)
    {
        $query = Feedback::with('user');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function (\Illuminate\Database\Eloquent\Builder $q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $feedbacks = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->through(fn($fb) => [
                'id'          => $fb->id,
                'user_id'     => $fb->user_id,
                'user_name'   => $fb->user->name ?? 'Unknown',
                'user_email'  => $fb->user->email ?? '',
                'category'    => $fb->category,
                'subject'     => $fb->subject,
                'message'     => $fb->message,
                'status'      => $fb->status,
                'priority'    => $fb->priority,
                'admin_reply' => $fb->admin_reply,
                'replied_at'  => $fb->replied_at?->format('d M Y H:i'),
                'created_at'  => $fb->created_at->format('d M Y H:i'),
            ]);

        // Stats
        $stats = [
            'total'     => Feedback::count(),
            'open'      => Feedback::where('status', 'OPEN')->count(),
            'inReview'  => Feedback::where('status', 'IN_REVIEW')->count(),
            'resolved'  => Feedback::where('status', 'RESOLVED')->count(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'tab'             => 'feedbacks',
            'feedbacks'       => $feedbacks,
            'feedbackStats'   => $stats,
            'filters'         => $request->only(['search', 'status', 'category']),
        ]);
    }

    /**
     * Admin replies to a feedback
     */
    public function reply(Request $request, Feedback $feedback)
    {
        $validated = $request->validate([
            'admin_reply' => 'required|string|max:5000',
        ]);

        $feedback->update([
            'admin_reply' => $validated['admin_reply'],
            'replied_at'  => Carbon::now(),
            'status'      => 'RESOLVED',
        ]);

        // Send notification to the user
        $feedback->user->notify(new FeedbackReplied($feedback));

        SystemLog::create([
            'admin_id' => $request->user()->id,
            'action'   => 'REPLY_FEEDBACK',
            'target'   => "Feedback #{$feedback->id}",
            'details'  => [
                'feedback_id' => $feedback->id,
                'user_id'     => $feedback->user_id,
                'subject'     => $feedback->subject,
            ],
        ]);

        return redirect()->back()->with('success', 'Balasan berhasil dikirim.');
    }

    /**
     * Update feedback status
     */
    public function updateStatus(Request $request, Feedback $feedback)
    {
        $validated = $request->validate([
            'status' => 'required|in:OPEN,IN_REVIEW,RESOLVED,CLOSED',
        ]);

        $oldStatus = $feedback->status;
        $feedback->update(['status' => $validated['status']]);

        SystemLog::create([
            'admin_id' => $request->user()->id,
            'action'   => 'UPDATE_FEEDBACK_STATUS',
            'target'   => "Feedback #{$feedback->id}",
            'details'  => [
                'feedback_id' => $feedback->id,
                'old_status'  => $oldStatus,
                'new_status'  => $validated['status'],
            ],
        ]);

        return redirect()->back()->with('success', 'Status feedback berhasil diperbarui.');
    }

    /**
     * Delete a feedback
     */
    public function destroy(Request $request, Feedback $feedback)
    {
        SystemLog::create([
            'admin_id' => $request->user()->id,
            'action'   => 'DELETE_FEEDBACK',
            'target'   => "Feedback #{$feedback->id}",
            'details'  => [
                'feedback_id' => $feedback->id,
                'user_id'     => $feedback->user_id,
                'subject'     => $feedback->subject,
            ],
        ]);

        $feedback->delete();

        return redirect()->back()->with('success', 'Feedback berhasil dihapus.');
    }
}
