<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedTinyInteger('smart_entry_limit')->default(5)->after('financial_profile');
            $table->unsignedTinyInteger('insight_limit')->default(1)->after('smart_entry_limit');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['smart_entry_limit', 'insight_limit']);
        });
    }
};
