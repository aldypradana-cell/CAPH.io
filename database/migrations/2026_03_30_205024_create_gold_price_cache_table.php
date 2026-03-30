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
        Schema::create('gold_price_cache', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->decimal('price_per_gram', 15, 2);
            $table->string('source_url')->default('https://www.logammulia.com/id/harga-emas-hari-ini');
            $table->timestamp('last_fetched_at')->nullable();
            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gold_price_cache');
    }
};
