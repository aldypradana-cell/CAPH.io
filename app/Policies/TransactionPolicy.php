<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Transaction;
use Illuminate\Auth\Access\Response;

class TransactionPolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, Transaction $model): bool { return $user->id === $model->user_id; }
    public function create(User $user): bool { return true; }
    public function update(User $user, Transaction $model): bool { return $user->id === $model->user_id; }
    public function delete(User $user, Transaction $model): bool { return $user->id === $model->user_id; }
    public function restore(User $user, Transaction $model): bool { return $user->id === $model->user_id; }
    public function forceDelete(User $user, Transaction $model): bool { return $user->id === $model->user_id; }
}
