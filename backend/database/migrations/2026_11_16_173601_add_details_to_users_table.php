<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('role')->default('pembeli')->after('phone'); // pembeli, penjual, admin
            $table->string('status_akun')->default('Aktif')->after('role'); // Aktif, Diblokir
            $table->string('status_verifikasi')->default('Terverifikasi')->after('status_akun'); // Menunggu, Terverifikasi, Ditolak
            $table->text('alamat')->nullable()->after('status_verifikasi');
            $table->decimal('latitude', 10, 7)->nullable()->after('alamat');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('catatan_alamat')->nullable()->after('longitude');
            $table->string('nama_toko')->nullable()->after('catatan_alamat');
            $table->text('alamat_toko')->nullable()->after('nama_toko');
            $table->string('nomor_rekening')->nullable()->after('alamat_toko');
            $table->string('nama_bank')->nullable()->after('nomor_rekening');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
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
            ]);
        });
    }
};
