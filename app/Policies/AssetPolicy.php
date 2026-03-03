<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Asset;
use Illuminate\Auth\Access\Response;

class AssetPolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, Asset $model): bool { return $user->id === $model->user_id; }
    public function create(User $user): bool { return true; }
    public function update(User $user, Asset $model): bool { return $user->id === $model->user_id; }
    public function delete(User $user, Asset $model): bool { return $user->id === $model->user_id; }
    public function restore(User $user, Asset $model): bool { return $user->id === $model->user_id; }
    public function forceDelete(User $user, Asset $model): bool { return $user->id === $model->user_id; }
}
