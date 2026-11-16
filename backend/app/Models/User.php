<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
        'status_akun',
        'status_verifikasi',
        'alamat',
        'latitude',
        'longitude',
        'catatan_alamat',
        'nama_toko',
        'alamat_toko',
        'nomor_rekening',
        'nama_bank',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'penjual_id');
    }

    public function buyerOrders()
    {
        return $this->hasMany(Order::class, 'pembeli_id');
    }

    public function sellerOrders()
    {
        return $this->hasMany(Order::class, 'penjual_id');
    }

    public function payouts()
    {
        return $this->hasMany(PayoutRecord::class, 'penjual_id');
    }
}
