<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Auth\Access\Response;

class WalletPolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, Wallet $model): bool { return $user->id === $model->user_id; }
    public function create(User $user): bool { return true; }
    public function update(User $user, Wallet $model): bool { return $user->id === $model->user_id; }
    public function delete(User $user, Wallet $model): bool { return $user->id === $model->user_id; }
    public function restore(User $user, Wallet $model): bool { return $user->id === $model->user_id; }
    public function forceDelete(User $user, Wallet $model): bool { return $user->id === $model->user_id; }
}
