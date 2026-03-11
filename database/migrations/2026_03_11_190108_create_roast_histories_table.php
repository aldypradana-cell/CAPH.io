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
        Schema::create('roast_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('level');            // 'MILD', 'MEDIUM', 'BRUTAL'
            $table->text('roast_text');
            $table->string('badge_name');
            $table->string('badge_emoji');
            $table->unsignedTinyInteger('waste_score');  // 0-100
            $table->text('challenge')->nullable();
            $table->json('categories_roasted')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roast_histories');
    }
};
