<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'pesanan_id',
        'nomor_transaksi',
        'metode_pembayaran',
        'jumlah_bayar',
        'status_pembayaran',
        'status_dana',
        'instruksi_pembayaran',
        'tanggal_pembayaran',
    ];

    protected $casts = [
        'jumlah_bayar' => 'float',
        'tanggal_pembayaran' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'pesanan_id');
    }
}
