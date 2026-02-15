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
            if (!Schema::hasColumn('transactions', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('transactions', function (Blueprint $table) {
            // Use unique names to avoid conflicts with existing indexes
            // We use a try-catch equivalent by checking implied logic or just custom names
            // If the index exists under a different name, adding another is fine (just redundant)
            // If it exists with same name, it fails.
            // Let's use custom names.
            try { $table->index(['user_id', 'date'], 'idx_opt_tx_date'); } catch (\Exception $e) {}
            try { $table->index(['user_id', 'type'], 'idx_opt_tx_type'); } catch (\Exception $e) {}
            try { $table->index(['user_id', 'category'], 'idx_opt_tx_cat'); } catch (\Exception $e) {}
        });

        Schema::table('debts', function (Blueprint $table) {
            if (!Schema::hasColumn('debts', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('debts', function (Blueprint $table) {
            try { $table->index(['user_id', 'type', 'is_paid'], 'idx_opt_debt_status'); } catch (\Exception $e) {}
        });

        Schema::table('budgets', function (Blueprint $table) {
             if (!Schema::hasColumn('budgets', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropIndex('idx_opt_tx_date');
            $table->dropIndex('idx_opt_tx_type');
            $table->dropIndex('idx_opt_tx_cat');
        });

        Schema::table('debts', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropIndex('idx_opt_debt_status');
        });

        Schema::table('budgets', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
