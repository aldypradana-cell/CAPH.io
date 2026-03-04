<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SystemLog;
use App\Models\AiUsageLog;
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

        $users = $query->orderBy('created_at', 'desc')->paginate(20)->through(function ($user) use ($today, $week) {
            $user->smart_entry_used_today = AiUsageLog::where('user_id', $user->id)
                ->where('feature', 'smart_entry')->where('used_at', '>=', $today)->count();
            $user->insight_used_this_week = AiUsageLog::where('user_id', $user->id)
                ->where('feature', 'ai_insight')->where('used_at', '>=', $week)->count();
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

        $user->delete();

        return redirect()->back()->with('success', 'User berhasil dihapus');
    }
}
