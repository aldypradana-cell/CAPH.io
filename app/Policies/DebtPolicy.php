<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Debt;
use Illuminate\Auth\Access\Response;

class DebtPolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, Debt $model): bool { return $user->id === $model->user_id; }
    public function create(User $user): bool { return true; }
    public function update(User $user, Debt $model): bool { return $user->id === $model->user_id; }
    public function delete(User $user, Debt $model): bool { return $user->id === $model->user_id; }
    public function restore(User $user, Debt $model): bool { return $user->id === $model->user_id; }
    public function forceDelete(User $user, Debt $model): bool { return $user->id === $model->user_id; }
}
