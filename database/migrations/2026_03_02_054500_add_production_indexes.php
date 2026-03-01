<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    /**
     * Add composite indexes for production performance.
     * These indexes optimize the most common query patterns:
     * - Budget progress: WHERE user_id AND type='EXPENSE' AND category IN (...) AND date BETWEEN
     * - Dashboard stats: WHERE user_id AND deleted_at IS NULL AND date BETWEEN
     * - Wallet queries: WHERE user_id
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Composite index for budget spent queries (covers whereIn category + date range)
            $table->index(['user_id', 'type', 'category', 'date'], 'idx_tx_budget_spent');

            // Composite index for soft-delete aware date range queries
            $table->index(['user_id', 'deleted_at', 'date'], 'idx_tx_softdel_date');
        });

        Schema::table('wallets', function (Blueprint $table) {
            // Index for wallet balance queries
            $table->index('user_id', 'idx_wallet_user');
        });

        Schema::table('assets', function (Blueprint $table) {
            // Index for asset value sum queries
            $table->index('user_id', 'idx_asset_user');
        });

        Schema::table('recurring_transactions', function (Blueprint $table) {
            // Index for recurring transaction queries
            $table->index(['user_id', 'is_active'], 'idx_recurring_user_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_tx_budget_spent');
            $table->dropIndex('idx_tx_softdel_date');
        });

        Schema::table('wallets', function (Blueprint $table) {
            $table->dropIndex('idx_wallet_user');
        });

        Schema::table('assets', function (Blueprint $table) {
            $table->dropIndex('idx_asset_user');
        });

        Schema::table('recurring_transactions', function (Blueprint $table) {
            $table->dropIndex('idx_recurring_user_active');
        });
    }
};
