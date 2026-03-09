<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'is_default',
        'is_hidden',
        'budget_rule',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'is_hidden' => 'boolean',
        ];
    }

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scopes
     */
    public function scopeUserCategories($query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('is_default', true)
                ->orWhere('user_id', $userId);
        })->where('is_hidden', false);
    }

    public function scopeAllUserCategories($query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('is_default', true)
                ->orWhere('user_id', $userId);
        });
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }
}
