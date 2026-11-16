<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayoutRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'pesanan_id',
        'penjual_id',
        'nominal',
        'nomor_rekening',
        'nama_bank',
        'status_pencairan',
        'tanggal_pencairan',
    ];

    protected $casts = [
        'nominal' => 'float',
        'tanggal_pencairan' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'pesanan_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'penjual_id');
    }
}
