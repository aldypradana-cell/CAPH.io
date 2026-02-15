<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'action',
        'target',
        'details',
    ];

    /**
     * Cast details as array/json so arrays can be stored and retrieved properly.
     */
    protected function casts(): array
    {
        return [
            'details' => 'array',
        ];
    }

    /**
     * Relationships
     */
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Quick helper to log an admin action.
     */
    public static function log(string $action, string $target, array $details = [], ?int $adminId = null): self
    {
        return static::create([
            'admin_id' => $adminId ?? auth()->id(),
            'action'   => $action,
            'target'   => $target,
            'details'  => $details,
        ]);
    }
}
