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

        // Global Smart Entry Rate Limiter
        RateLimiter::for('ai-smart-entry-global', function (Request $request) {
            if ($request->user() && $request->user()->role === 'ADMIN') {
                return \Illuminate\Cache\RateLimiting\Limit::none();
            }

            return [
                Limit::perMinute((int) env('AI_SMART_ENTRY_RPM', 5))->response(function (Request $request) {
                    $message = 'Server sedang sibuk. Silakan coba lagi dalam 1 menit.';
                    $response = response()->json(['message' => $message], 429);
                    if ($request->hasHeader('X-Inertia')) {
                        $response->header('X-Inertia', 'true');
                    }
                    return $response;
                }),
                Limit::perDay((int) env('AI_SMART_ENTRY_RPD', 20))->response(function (Request $request) {
                    $message = 'Batas penggunaan AI harian telah tercapai. Coba lagi besok.';
                    $response = response()->json(['message' => $message], 429);
                    if ($request->hasHeader('X-Inertia')) {
                        $response->header('X-Inertia', 'true');
                    }
                    return $response;
                }),
            ];
        });

        // Global AI Insight Rate Limiter
        RateLimiter::for('ai-insight-global', function (Request $request) {
            if ($request->user() && $request->user()->role === 'ADMIN') {
                return \Illuminate\Cache\RateLimiting\Limit::none();
            }

            return [
                Limit::perMinute((int) env('AI_INSIGHT_RPM', 2))->response(function (Request $request) {
                    $message = 'Server sedang sibuk. Silakan coba lagi dalam 1 menit.';
                    $response = response()->json(['message' => $message], 429);
                    if ($request->hasHeader('X-Inertia')) {
                        $response->header('X-Inertia', 'true');
                    }
                    return $response;
                }),
                Limit::perDay((int) env('AI_INSIGHT_RPD', 10))->response(function (Request $request) {
                    $message = 'Batas penggunaan AI harian telah tercapai. Coba lagi besok.';
                    $response = response()->json(['message' => $message], 429);
                    if ($request->hasHeader('X-Inertia')) {
                        $response->header('X-Inertia', 'true');
                    }
                    return $response;
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
