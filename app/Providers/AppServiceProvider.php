<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Prevent lazy loading in non-production to catch N+1 queries early.
        // In production, log violations instead of throwing exceptions to avoid breaking the app.
        Model::preventLazyLoading(! $this->app->isProduction());

        // In production, log lazy loading violations instead of crashing
        if ($this->app->isProduction()) {
            Model::handleLazyLoadingViolationUsing(function (Model $model, string $relation) {
                $class = get_class($model);
                logger()->warning("Lazy loading detected: {$class}::{$relation}");
            });
        }
    }
}
