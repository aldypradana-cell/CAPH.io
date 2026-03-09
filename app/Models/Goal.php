<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Goal extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'target_amount',
        'deadline',
        'current_amount',
        'color',
        'icon',
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'current_amount' => 'decimal:2',
        'deadline' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
