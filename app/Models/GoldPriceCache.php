<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoldPriceCache extends Model
{
    protected $table = 'gold_price_cache';

    protected $fillable = [
        'date',
        'price_per_gram',
        'source_url',
        'last_fetched_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'price_per_gram' => 'decimal:2',
            'last_fetched_at' => 'datetime',
        ];
    }
}
