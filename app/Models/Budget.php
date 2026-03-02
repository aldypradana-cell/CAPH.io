<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Budget extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'category',
        'limit',
        'period',
        'frequency',
        'is_master',
    ];

    protected function casts(): array
    {
        return [
            'limit' => 'decimal:2',
            'is_master' => 'boolean',
        ];
    }

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

// NOTE: Removed transactions() relationship (was via string 'category' without user_id filter).
// Use direct queries with user_id + category filter instead (see BudgetController, TransactionService).
}
