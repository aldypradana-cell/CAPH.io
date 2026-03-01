<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecurringTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'amount',
        'wallet_id',
        'type',
        'category',
        'frequency',
        'start_date',
        'next_run_date',
        'auto_cut',
        'is_active',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'start_date' => 'date',
            'next_run_date' => 'date',
            'auto_cut' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDue($query)
    {
        return $query->where('next_run_date', '<=', now())
            ->where('is_active', true);
    }

    /**
     * Helper to calculate next run date based on frequency
     */
    public function calculateNextRunDate()
    {
        $current = $this->next_run_date;

        return match ($this->frequency) {
                'DAILY' => $current->copy()->addDay(),
                'WEEKLY' => $current->copy()->addWeek(),
                'MONTHLY' => $current->copy()->addMonth(),
                'YEARLY' => $current->copy()->addYear(),
                default => $current->copy()->addMonth(),
            };
    }
}
