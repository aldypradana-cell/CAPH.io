<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('wallet_id');
            $table->index('date');
            $table->index('type');
            $table->index('category');
        });

        Schema::table('budgets', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('period');
        });

        Schema::table('debts', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('is_paid');
        });

        Schema::table('recurring_transactions', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('next_run_date');
            $table->index('is_active');
        });

        Schema::table('installments', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('is_completed');
            $table->index('due_day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['wallet_id']);
            $table->dropIndex(['date']);
            $table->dropIndex(['type']);
            $table->dropIndex(['category']);
        });

        Schema::table('budgets', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['period']);
        });

        Schema::table('debts', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['is_paid']);
        });

        Schema::table('recurring_transactions', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['next_run_date']);
            $table->dropIndex(['is_active']);
        });

        Schema::table('installments', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['is_completed']);
            $table->dropIndex(['due_day']);
        });
    }
};
