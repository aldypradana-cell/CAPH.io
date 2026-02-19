<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\SmartEntryController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\DebtController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\InsightsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\SystemLogController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\Admin\MasterDataController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RecurringTransactionController;
use Illuminate\Support\Facades\Route;

// Redirect to dashboard if authenticated, otherwise to login
Route::get('/', function () {
    return auth()->check()
    ? redirect()->route('dashboard')
    : redirect()->route('login');
});

// Authenticated routes
Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class , 'index'])->name('dashboard');

    // Transactions
    Route::resource('transactions', TransactionController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Smart Entry (AI)
    Route::get('/smart-entry', [SmartEntryController::class , 'index'])->name('smart-entry.index');
    Route::post('/smart-entry/parse', [SmartEntryController::class , 'parse'])->name('smart-entry.parse');
    Route::post('/smart-entry/confirm', [SmartEntryController::class , 'confirm'])->name('smart-entry.confirm');

    // Wallets
    Route::resource('wallets', WalletController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Recurring Transactions
    Route::resource('recurring', RecurringTransactionController::class)
        ->only(['store', 'update', 'destroy']);
    Route::post('/recurring/{recurring}/process', [RecurringTransactionController::class , 'process'])->name('recurring.process');
    Route::get('/api/dashboard/recurring', [RecurringTransactionController::class , 'dashboardWidget'])->name('api.dashboard.recurring');

    // Budgets
    Route::resource('budgets', BudgetController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Debts / Receivables / Bills
    Route::resource('debts', DebtController::class)
        ->only(['index', 'store', 'update', 'destroy']);
    Route::post('/debts/{debt}/toggle-paid', [DebtController::class , 'togglePaid'])->name('debts.toggle-paid');

    // Notifications API
    Route::get('/api/notifications', [NotificationController::class , 'index'])->name('notifications.index');
    Route::post('/api/notifications/{id}/read', [NotificationController::class , 'markAsRead'])->name('notifications.read');
    Route::post('/api/notifications/read-all', [NotificationController::class , 'markAllRead'])->name('notifications.readAll');

    // Assets

    // Assets
    Route::resource('assets', AssetController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Categories
    Route::resource('categories', CategoryController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Financial Insights (AI)
    Route::get('/insights', [InsightsController::class , 'index'])->name('insights.index');
    Route::post('/insights/generate', [InsightsController::class , 'generate'])->name('insights.generate');
    Route::post('/insights/profile', [InsightsController::class , 'updateProfile'])->name('insights.profile');

    // Profile
    Route::get('/profile', [ProfileController::class , 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class , 'update'])->name('profile.update');
    Route::patch('/profile/preferences', [ProfileController::class , 'updatePreferences'])->name('profile.preferences');
    Route::patch('/profile/financial', [ProfileController::class , 'updateFinancialProfile'])->name('profile.financial');
    Route::delete('/profile', [ProfileController::class , 'destroy'])->name('profile.destroy');

    // Export
    Route::get('/export', fn() => \Inertia\Inertia::render('Export/Index', [
    'wallets' => $wallets = \App\Models\Wallet::where('user_id', auth()->id())->get(['id', 'name']),
    ]))->name('export.index');
    Route::get('/export/preview', [\App\Http\Controllers\ExportController::class , 'preview'])->name('export.preview');
    Route::get('/export/download', [\App\Http\Controllers\ExportController::class , 'download'])->name('export.download');

    // Settings, Notifications, Help (frontend-only pages)
    Route::get('/settings', fn() => \Inertia\Inertia::render('Settings/Index'))->name('settings.index');
    Route::get('/notifications-page', [NotificationController::class , 'page'])->name('notifications.page');
    Route::get('/help', fn() => \Inertia\Inertia::render('Help/Index'))->name('help.index');

    // Admin routes (protected by admin middleware)
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
            Route::get('/dashboard', [AdminDashboardController::class , 'index'])->name('dashboard');
            Route::get('/users', [UserManagementController::class , 'index'])->name('users.index');
            Route::post('/users/{user}/suspend', [UserManagementController::class , 'suspend'])->name('users.suspend');
            Route::delete('/users/{user}', [UserManagementController::class , 'destroy'])->name('users.destroy');
            Route::get('/logs', [SystemLogController::class , 'index'])->name('logs.index');

            // Admin Transactions
            Route::get('/transactions', [AdminTransactionController::class , 'index'])->name('transactions.index');

            // Admin Master Data
            Route::get('/master', [MasterDataController::class , 'index'])->name('master.index');
            Route::post('/master/seed', [MasterDataController::class , 'seed'])->name('master.seed');
            Route::post('/master/categories', [MasterDataController::class , 'storeCategory'])->name('master.categories.store');
            Route::put('/master/categories/{category}', [MasterDataController::class , 'updateCategory'])->name('master.categories.update');
            Route::delete('/master/categories/{category}', [MasterDataController::class , 'destroyCategory'])->name('master.categories.destroy');
        }
        );
    });

require __DIR__ . '/auth.php';
