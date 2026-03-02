<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('type', ['PROPERTY', 'VEHICLE', 'LOAN', 'GADGET', 'OTHER'])->default('LOAN');
            $table->enum('interest_type', ['FLAT', 'FLOATING', 'MIXED', 'NONE'])->default('FLAT');
            $table->decimal('total_amount', 15, 2);
            $table->decimal('monthly_amount', 15, 2);
            $table->integer('total_tenor');
            $table->integer('paid_tenor')->default(0);
            $table->decimal('interest_rate', 5, 2)->nullable();
            $table->integer('fixed_tenor')->nullable();
            $table->integer('due_day');
            $table->date('start_date');
            $table->string('lender');
            $table->foreignId('wallet_id')->nullable()->constrained()->nullOnDelete();
            $table->text('notes')->nullable();
            $table->boolean('auto_debit')->default(false);
            $table->boolean('is_completed')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'is_completed']);
        });

        Schema::create('installment_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('installment_id')->constrained()->onDelete('cascade');
            $table->integer('tenor_number');
            $table->decimal('amount', 15, 2);
            $table->date('paid_at');
            $table->foreignId('wallet_id')->constrained();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['installment_id', 'tenor_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installment_payments');
        Schema::dropIfExists('installments');
    }
};
