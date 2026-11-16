<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_pesanan',
        'pembeli_id',
        'penjual_id',
        'produk_id',
        'kuantitas',
        'harga_satuan',
        'total_bayar',
        'tanggal_pesanan',
        'status_pesanan',
        'batas_waktu_bayar',
        'estimasi_sampai',
        'nomor_resi',
        'kurir',
        'alamat_tujuan',
        'alasan_batal',
    ];

    protected $casts = [
        'kuantitas' => 'integer',
        'harga_satuan' => 'float',
        'total_bayar' => 'float',
        'tanggal_pesanan' => 'datetime',
        'batas_waktu_bayar' => 'datetime',
        'estimasi_sampai' => 'datetime',
    ];

    public function buyer()
    {
        return $this->belongsTo(User::class, 'pembeli_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'penjual_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'produk_id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, 'pesanan_id');
    }

    public function payoutRecord()
    {
        return $this->hasOne(PayoutRecord::class, 'pesanan_id');
    }
}
