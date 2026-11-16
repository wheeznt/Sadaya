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
        Schema::create('payout_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('penjual_id')->constrained('users')->onDelete('cascade');
            $table->decimal('nominal', 12, 2);
            $table->string('nomor_rekening');
            $table->string('nama_bank');
            $table->string('status_pencairan')->default('TERKIRIM'); // TERKIRIM, PENDING_FAILED
            $table->timestamp('tanggal_pencairan')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payout_records');
    }
};
