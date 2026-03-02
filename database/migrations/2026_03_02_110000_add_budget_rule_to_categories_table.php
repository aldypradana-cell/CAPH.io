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
        Schema::table('categories', function (Blueprint $table) {
            $table->enum('budget_rule', ['NEEDS', 'WANTS', 'SAVINGS', 'INVESTMENTS'])
                ->nullable()
                ->default(null)
                ->after('is_default');
        });

        // Map existing default categories to their budget rules
        $mappings = [
            'NEEDS' => ['Makanan', 'Transportasi', 'Tagihan', 'Kesehatan', 'Pendidikan'],
            'WANTS' => ['Belanja', 'Hiburan'],
        ];

        foreach ($mappings as $rule => $names) {
            DB::table('categories')
                ->where('is_default', true)
                ->where('type', 'EXPENSE')
                ->whereIn('name', $names)
                ->update(['budget_rule' => $rule]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('budget_rule');
        });
    }
};
