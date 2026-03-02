<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Installment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'interest_type',
        'total_amount',
        'monthly_amount',
        'total_tenor',
        'paid_tenor',
        'interest_rate',
        'fixed_tenor',
        'due_day',
        'start_date',
        'lender',
        'wallet_id',
        'notes',
        'auto_debit',
        'is_completed',
    ];

    protected function casts(): array
    {
        return [
            'total_amount'  => 'decimal:2',
            'monthly_amount' => 'decimal:2',
            'interest_rate' => 'decimal:2',
            'start_date'    => 'date',
            'auto_debit'    => 'boolean',
            'is_completed'  => 'boolean',
        ];
    }

    // --- Relationships ---

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }

    public function payments()
    {
        return $this->hasMany(InstallmentPayment::class)->orderBy('tenor_number');
    }

    // --- Accessors ---

    public function getRemainingAmountAttribute(): float
    {
        $totalPaid = $this->payments()->sum('amount');
        return max(0, $this->total_amount - $totalPaid);
    }

    public function getProgressPercentageAttribute(): float
    {
        if ($this->total_tenor <= 0) return 0;
        return round(($this->paid_tenor / $this->total_tenor) * 100, 1);
    }

    public function getRemainingTenorAttribute(): int
    {
        return max(0, $this->total_tenor - $this->paid_tenor);
    }
}
