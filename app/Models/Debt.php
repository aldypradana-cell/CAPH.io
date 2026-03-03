<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Debt extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'type',
        'person',
        'amount',
        'description',
        'due_date',
        'is_paid',
    ];

    protected function casts(): array
    {
        return [
            'amount'  => 'decimal:2',
            'due_date' => 'date',
            'is_paid' => 'boolean',
        ];
    }

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function payments()
    {
        return $this->hasMany(DebtPayment::class)->orderBy('date', 'asc');
    }

    /**
     * Computed Properties
     */
    public function getPaidAmountAttribute(): float
    {
        return (float) $this->payments->sum('amount');
    }

    public function getRemainingAmountAttribute(): float
    {
        return max(0, (float) $this->amount - $this->paid_amount);
    }

    public function getProgressPercentageAttribute(): int
    {
        if ((float) $this->amount <= 0) return 0;
        return min(100, (int) round(($this->paid_amount / (float) $this->amount) * 100));
    }

    /**
     * Scopes
     */
    public function scopeUnpaid($query)
    {
        return $query->where('is_paid', false);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('is_paid', false)
                     ->where('due_date', '>=', now())
                     ->orderBy('due_date');
    }
}

