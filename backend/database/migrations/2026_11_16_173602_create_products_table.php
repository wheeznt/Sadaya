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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('penjual_id')->constrained('users')->onDelete('cascade');
            $table->string('nama_produk');
            $table->string('kategori');
            $table->decimal('harga', 12, 2);
            $table->integer('stok')->default(0);
            $table->integer('minimum_pembelian')->default(1);
            $table->text('deskripsi')->nullable();
            $table->boolean('status_aktif')->default(true);
            $table->text('foto')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
