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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_pesanan')->unique();
            $table->foreignId('pembeli_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('penjual_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('produk_id')->constrained('products')->onDelete('cascade');
            $table->integer('kuantitas');
            $table->decimal('harga_satuan', 12, 2);
            $table->decimal('total_bayar', 12, 2);
            $table->timestamp('tanggal_pesanan')->useCurrent();
            $table->string('status_pesanan')->default('Menunggu Pembayaran'); // Menunggu Pembayaran, Dibayar, Diproses, Dikirim, Selesai, Dibatalkan
            $table->timestamp('batas_waktu_bayar')->nullable();
            $table->timestamp('estimasi_sampai')->nullable();
            $table->string('nomor_resi')->nullable();
            $table->string('kurir')->nullable();
            $table->text('alamat_tujuan')->nullable();
            $table->text('alasan_batal')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
