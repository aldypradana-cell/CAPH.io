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
        // Add SAVING to the wallet type enum
        DB::statement("ALTER TABLE wallets MODIFY COLUMN type ENUM('CASH', 'BANK', 'E-WALLET', 'SAVING') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE wallets MODIFY COLUMN type ENUM('CASH', 'BANK', 'E-WALLET') NOT NULL");
    }
};
