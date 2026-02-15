<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'color',
    ];

    /**
     * Auto-generate slug from name when creating.
     */
    protected static function booted(): void
    {
        static::creating(function (Tag $tag) {
            if (empty($tag->slug)) {
                $tag->slug = Str::slug($tag->name);
            }
        });
    }

    // ── Relationships ─────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->belongsToMany(Transaction::class, 'transaction_tag');
    }

    // ── Helpers ───────────────────────────────────────

    /**
     * Generate a random pastel color for new tags.
     */
    public static function randomColor(): string
    {
        $colors = [
            '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
            '#ec4899', '#f43f5e', '#ef4444', '#f97316',
            '#eab308', '#84cc16', '#22c55e', '#14b8a6',
            '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
        ];

        return $colors[array_rand($colors)];
    }
}
