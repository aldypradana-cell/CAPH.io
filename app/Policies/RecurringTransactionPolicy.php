<?php

namespace App\Policies;

use App\Models\User;
use App\Models\RecurringTransaction;
use Illuminate\Auth\Access\Response;

class RecurringTransactionPolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, RecurringTransaction $model): bool { return $user->id === $model->user_id; }
    public function create(User $user): bool { return true; }
    public function update(User $user, RecurringTransaction $model): bool { return $user->id === $model->user_id; }
    public function delete(User $user, RecurringTransaction $model): bool { return $user->id === $model->user_id; }
    public function restore(User $user, RecurringTransaction $model): bool { return $user->id === $model->user_id; }
    public function forceDelete(User $user, RecurringTransaction $model): bool { return $user->id === $model->user_id; }
}
