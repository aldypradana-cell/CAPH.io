<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Installment;
use Illuminate\Auth\Access\Response;

class InstallmentPolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, Installment $model): bool { return $user->id === $model->user_id; }
    public function create(User $user): bool { return true; }
    public function update(User $user, Installment $model): bool { return $user->id === $model->user_id; }
    public function delete(User $user, Installment $model): bool { return $user->id === $model->user_id; }
    public function restore(User $user, Installment $model): bool { return $user->id === $model->user_id; }
    public function forceDelete(User $user, Installment $model): bool { return $user->id === $model->user_id; }
}
