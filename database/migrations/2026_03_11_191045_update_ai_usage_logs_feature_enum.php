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
        // DB::statement is more reliable for ENUM changes in MySQL
        DB::statement("ALTER TABLE ai_usage_logs MODIFY COLUMN feature ENUM('smart_entry', 'ai_insight', 'roast_me') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE ai_usage_logs MODIFY COLUMN feature ENUM('smart_entry', 'ai_insight') NOT NULL");
    }
};
