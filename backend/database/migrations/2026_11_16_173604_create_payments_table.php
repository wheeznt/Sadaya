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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->constrained('orders')->onDelete('cascade');
            $table->string('nomor_transaksi')->unique();
            $table->string('metode_pembayaran');
            $table->decimal('jumlah_bayar', 12, 2);
            $table->string('status_pembayaran')->default('Menunggu'); // Menunggu, Berhasil, Gagal, Kedaluwarsa
            $table->string('status_dana')->default('Ditahan'); // Ditahan (Hold Escrow), Terkirim
            $table->text('instruksi_pembayaran')->nullable();
            $table->timestamp('tanggal_pembayaran')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
