<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Budget;
use Illuminate\Auth\Access\Response;

class BudgetPolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, Budget $model): bool { return $user->id === $model->user_id; }
    public function create(User $user): bool { return true; }
    public function update(User $user, Budget $model): bool { return $user->id === $model->user_id; }
    public function delete(User $user, Budget $model): bool { return $user->id === $model->user_id; }
    public function restore(User $user, Budget $model): bool { return $user->id === $model->user_id; }
    public function forceDelete(User $user, Budget $model): bool { return $user->id === $model->user_id; }
}
