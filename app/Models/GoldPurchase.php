<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoldPurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'grams',
        'price_per_gram',
        'purchased_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'grams' => 'decimal:3',
            'price_per_gram' => 'decimal:2',
            'purchased_at' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
