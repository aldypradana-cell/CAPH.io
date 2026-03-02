<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstallmentPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'installment_id',
        'tenor_number',
        'amount',
        'paid_at',
        'wallet_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount'  => 'decimal:2',
            'paid_at' => 'date',
        ];
    }

    public function installment()
    {
        return $this->belongsTo(Installment::class);
    }

    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }
}
