<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'penjual_id',
        'nama_produk',
        'kategori',
        'harga',
        'stok',
        'minimum_pembelian',
        'deskripsi',
        'status_aktif',
        'foto',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'float',
            'stok' => 'integer',
            'minimum_pembelian' => 'integer',
            'status_aktif' => 'boolean',
        ];
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'penjual_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'produk_id');
    }
}
