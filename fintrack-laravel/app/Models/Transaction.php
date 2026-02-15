<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'wallet_id',
        'to_wallet_id',
        'date',
        'description',
        'amount',
        'type',
        'category',
        'is_flagged',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'amount' => 'decimal:2',
            'is_flagged' => 'boolean',
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
        return $this->belongsTo(Wallet::class, 'wallet_id');
    }

    public function toWallet()
    {
        return $this->belongsTo(Wallet::class, 'to_wallet_id');
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'transaction_tag');
    }

    /**
     * Scopes
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeInDateRange($query, $start, $end)
    {
        return $query->whereBetween('date', [$start, $end]);
    }
}
