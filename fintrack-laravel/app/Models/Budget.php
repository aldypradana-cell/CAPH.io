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
    ];

    protected function casts(): array
    {
        return [
            'limit' => 'decimal:2',
        ];
    }

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        // Relasi ke transaksi berdasarkan kategori
        // Kita juga perlu memastikan transaksi tersebut milik user yang sama
        // Namun di level relasi model ini, kita hanya menghubungkan via category
        // Filtering user_id sebaiknya dilakukan saat eager loading atau query
        return $this->hasMany(Transaction::class, 'category', 'category');
    }
}
