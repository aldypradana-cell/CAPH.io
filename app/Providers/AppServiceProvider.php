<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Http\Request;

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

        // Global AI Rate Limiter (safety net for all users combined)
        // To change limits, update AI_GLOBAL_RPM and AI_GLOBAL_RPD in .env
        // then run: php artisan optimize:clear
        RateLimiter::for('ai-global', function (Request $request) {
            return [
                Limit::perMinute((int) env('AI_GLOBAL_RPM', 5))->response(function () {
                    return response()->json([
                        'success' => false,
                        'message' => 'Server sedang sibuk. Silakan coba lagi dalam 1 menit.',
                    ], 429);
                }),
                Limit::perDay((int) env('AI_GLOBAL_RPD', 20))->response(function () {
                    return response()->json([
                        'success' => false,
                        'message' => 'Batas penggunaan AI harian telah tercapai. Coba lagi besok.',
                    ], 429);
                }),
            ];
        });

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
