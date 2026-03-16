<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SystemLog;
use App\Models\AiUsageLog;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->withCount(['transactions', 'wallets']);

        if ($request->filled('search')) {
            $search = $request->search;
            /** @var \Illuminate\Database\Eloquent\Builder $query */
            $query->where(function (\Illuminate\Database\Eloquent\Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $today = Carbon::today();
        $week  = Carbon::now()->startOfWeek(Carbon::MONDAY);

        $userPage = $query->orderBy('created_at', 'desc')->paginate(20);
        $userIds = $userPage->getCollection()->pluck('id');

        $smartEntryUsageToday = AiUsageLog::whereIn('user_id', $userIds)
            ->where('feature', 'smart_entry')
            ->where('used_at', '>=', $today)
            ->selectRaw('user_id, COUNT(*) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        $insightUsageThisWeek = AiUsageLog::whereIn('user_id', $userIds)
            ->where('feature', 'ai_insight')
            ->where('used_at', '>=', $week)
            ->selectRaw('user_id, COUNT(*) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        $roastUsageThisWeek = AiUsageLog::whereIn('user_id', $userIds)
            ->where('feature', 'roast_me')
            ->where('used_at', '>=', $week)
            ->selectRaw('user_id, COUNT(*) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        $lastTransactionAt = Transaction::whereIn('user_id', $userIds)
            ->selectRaw('user_id, MAX(created_at) as last_transaction_at')
            ->groupBy('user_id')
            ->pluck('last_transaction_at', 'user_id');

        $lastAiUsageAt = AiUsageLog::whereIn('user_id', $userIds)
            ->selectRaw('user_id, MAX(used_at) as last_ai_usage_at')
            ->groupBy('user_id')
            ->pluck('last_ai_usage_at', 'user_id');

        $users = $userPage->through(function ($user) use ($smartEntryUsageToday, $insightUsageThisWeek, $roastUsageThisWeek, $lastTransactionAt, $lastAiUsageAt) {
            $user->smart_entry_used_today = (int) ($smartEntryUsageToday[$user->id] ?? 0);
            $user->insight_used_this_week = (int) ($insightUsageThisWeek[$user->id] ?? 0);
            $user->roast_used_this_week = (int) ($roastUsageThisWeek[$user->id] ?? 0);
            $user->last_transaction_at = $lastTransactionAt[$user->id] ?? null;
            $user->last_ai_usage_at = $lastAiUsageAt[$user->id] ?? null;
            $user->last_activity_at = $user->last_ai_usage_at ?? $user->last_transaction_at ?? $user->created_at;
            return $user;
        });

        return Inertia::render('Admin/Dashboard', [
            'tab'     => 'users',
            'users'   => $users,
            'filters' => $request->only(['search', 'role', 'status']),
        ]);
    }

    /**
     * Toggle user suspension status
     */
    public function suspend(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return redirect()->back()->withErrors(['error' => 'Tidak bisa menangguhkan akun sendiri.']);
        }

        $newStatus = $user->status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        $user->update(['status' => $newStatus]);

        // Log the action
        $oldStatus = $newStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        SystemLog::create([
            'admin_id' => $request->user()->id,
            'action' => $newStatus === 'SUSPENDED' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
            'target' => "User #{$user->id} ({$user->email})",
            'details' => [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ],
        ]);

        return redirect()->back()->with('success',
            $newStatus === 'SUSPENDED' ? 'User berhasil ditangguhkan' : 'User berhasil diaktifkan kembali'
        );
    }

    /**
     * Update per-user AI quota limits
     */
    public function updateQuota(Request $request, User $user)
    {
        if ($user->role === 'ADMIN') {
            return response()->json(['error' => 'Tidak bisa mengubah kuota admin.'], 403);
        }

        $validated = $request->validate([
            'smart_entry_limit' => 'required|integer|min:1|max:100',
            'insight_limit'     => 'required|integer|min:0|max:10',
            'roast_limit'       => 'required|integer|min:0|max:20',
        ]);

        $user->update($validated);

        SystemLog::create([
            'admin_id' => $request->user()->id,
            'action'   => 'UPDATE_AI_QUOTA',
            'target'   => "User #{$user->id} ({$user->email})",
            'details'  => [
                'user_id'           => $user->id,
                'smart_entry_limit' => $validated['smart_entry_limit'],
                'insight_limit'     => $validated['insight_limit'],
                'roast_limit'       => $validated['roast_limit'],
            ],
        ]);

        return redirect()->back()->with('success', 'Kuota AI berhasil diperbarui.');
    }

    /**
     * Delete a user
     */
    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return redirect()->back()->withErrors(['error' => 'Tidak bisa menghapus akun sendiri.']);
        }

        if ($user->role === 'ADMIN') {
            return redirect()->back()->withErrors(['error' => 'Tidak bisa menghapus akun admin lain.']);
        }

        // Log before deleting
        SystemLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'DELETE_USER',
            'target' => "User #{$user->id} ({$user->email})",
            'details' => [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'user_name' => $user->name,
            ],
        ]);

        // Cascade delete all user data to prevent orphan records
        \App\Models\Transaction::withTrashed()->where('user_id', $user->id)->forceDelete();
        \App\Models\Wallet::where('user_id', $user->id)->delete();
        \App\Models\Budget::withTrashed()->where('user_id', $user->id)->forceDelete();
        \App\Models\Debt::withTrashed()->where('user_id', $user->id)->forceDelete();
        \App\Models\RecurringTransaction::where('user_id', $user->id)->delete();
        \App\Models\Category::where('user_id', $user->id)->delete();
        \App\Models\Asset::where('user_id', $user->id)->delete();
        \App\Models\FinancialInsight::where('user_id', $user->id)->delete();
        \App\Models\Tag::where('user_id', $user->id)->delete();
        AiUsageLog::where('user_id', $user->id)->delete();
        \App\Models\Feedback::where('user_id', $user->id)->delete();

        $user->delete();

        return redirect()->back()->with('success', 'User berhasil dihapus');
    }
}
