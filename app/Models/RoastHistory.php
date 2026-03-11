<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoastHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'level',
        'roast_text',
        'badge_name',
        'badge_emoji',
        'waste_score',
        'challenge',
        'categories_roasted',
    ];

    protected function casts(): array
    {
        return [
            'categories_roasted' => 'array',
            'waste_score' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
