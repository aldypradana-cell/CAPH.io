<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('debts', function (Blueprint $table) {
            // Using DB::statement because doctrine/dbal is not installed
            DB::statement('ALTER TABLE debts MODIFY description TEXT NULL');
            DB::statement('ALTER TABLE debts MODIFY due_date DATE NULL');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('debts', function (Blueprint $table) {
            DB::statement('UPDATE debts SET description="" WHERE description IS NULL');
            DB::statement('UPDATE debts SET due_date=CURRENT_DATE WHERE due_date IS NULL');
            DB::statement('ALTER TABLE debts MODIFY description TEXT NOT NULL');
            DB::statement('ALTER TABLE debts MODIFY due_date DATE NOT NULL');
        });
    }
};
