<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Allow wallet_id to be nullable for PayLater transactions
     * (transactions where payment is deferred, no wallet is touched).
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Drop existing foreign key first, then re-add as nullable
            $table->dropForeign(['wallet_id']);
            $table->foreignId('wallet_id')->nullable()->change();
            $table->foreign('wallet_id')->references('id')->on('wallets')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['wallet_id']);
            $table->foreignId('wallet_id')->nullable(false)->change();
            $table->foreign('wallet_id')->references('id')->on('wallets')->onDelete('cascade');
        });
    }
};
