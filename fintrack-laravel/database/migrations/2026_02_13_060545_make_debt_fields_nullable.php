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
            $table->text('description')->nullable()->change();
            $table->date('due_date')->nullable()->change();
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
            $table->text('description')->nullable(false)->change();
            $table->date('due_date')->nullable(false)->change();
        });
    }
};
