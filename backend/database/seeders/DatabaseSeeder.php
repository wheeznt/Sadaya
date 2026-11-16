<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PayoutRecord;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin Sistem
        $admin = User::create([
            'name' => 'Admin Sadaya Pangan',
            'email' => 'admin@sadaya.id',
            'password' => Hash::make('password'),
            'phone' => '081234567890',
            'role' => 'admin',
            'status_akun' => 'Aktif',
            'status_verifikasi' => 'Terverifikasi',
            'alamat' => 'Kantor Manajemen Pangan, Cibiru, Kota Bandung',
            'latitude' => -6.932400,
            'longitude' => 107.717900,
        ]);

        // 2. Penjual 1 (Terverifikasi - Cibiru)
        $seller1 = User::create([
            'name' => 'Haji Suryana',
            'email' => 'tani_makmur@sadaya.id',
            'password' => Hash::make('password'),
            'phone' => '082123456781',
            'role' => 'penjual',
            'status_akun' => 'Aktif',
            'status_verifikasi' => 'Terverifikasi',
            'nama_toko' => 'Kelompok Tani Makmur Cibiru',
            'alamat_toko' => 'Jl. Raya Cibiru No. 45, Cibiru, Bandung',
            'latitude' => -6.931252,
            'longitude' => 107.717142,
            'nomor_rekening' => '5420987612',
            'nama_bank' => 'Bank Mandiri',
        ]);

        // 3. Penjual 2 (Terverifikasi - Lembang)
        $seller2 = User::create([
            'name' => 'Ahmad Fauzi',
            'email' => 'berkah_pangan@sadaya.id',
            'password' => Hash::make('password'),
            'phone' => '082123456782',
            'role' => 'penjual',
            'status_akun' => 'Aktif',
            'status_verifikasi' => 'Terverifikasi',
            'nama_toko' => 'Berkah Sayur & Pangan Lembang',
            'alamat_toko' => 'Jl. Maribaya No. 12, Lembang, Bandung Barat',
            'latitude' => -6.816667,
            'longitude' => 107.616667,
            'nomor_rekening' => '0148876543',
            'nama_bank' => 'Bank BCA',
        ]);

        // 4. Penjual 3 (Menunggu Verifikasi Admin - UC-01 & UC-12 demo)
        $seller3 = User::create([
            'name' => 'Budi Santoso',
            'email' => 'penjual_baru@sadaya.id',
            'password' => Hash::make('password'),
            'phone' => '082123456783',
            'role' => 'penjual',
            'status_akun' => 'Aktif',
            'status_verifikasi' => 'Menunggu',
            'nama_toko' => 'Toko Sembako Segar Barokah',
            'alamat_toko' => 'Jl. Soekarno Hatta No. 700, Bandung',
            'latitude' => -6.940000,
            'longitude' => 107.670000,
            'nomor_rekening' => '1120034567',
            'nama_bank' => 'Bank BRI',
        ]);

        // 5. Pembeli 1 (Aktif - Di sekitar Kampus UPI Cibiru)
        $buyer1 = User::create([
            'name' => 'Azka Athallah (Pembeli)',
            'email' => 'pembeli@sadaya.id',
            'password' => Hash::make('password'),
            'phone' => '085712345678',
            'role' => 'pembeli',
            'status_akun' => 'Aktif',
            'status_verifikasi' => 'Terverifikasi',
            'alamat' => 'Komplek Griya Cibiru Indah Blok C No. 5, Cibiru',
            'latitude' => -6.932800,
            'longitude' => 107.718500,
            'catatan_alamat' => 'Dekat gerbang kampus UPI di Cibiru',
        ]);

        // 6. Pembeli 2 (Aktif - Dago)
        $buyer2 = User::create([
            'name' => 'Siti Nurhaliza',
            'email' => 'siti@sadaya.id',
            'password' => Hash::make('password'),
            'phone' => '085799988877',
            'role' => 'pembeli',
            'status_akun' => 'Aktif',
            'status_verifikasi' => 'Terverifikasi',
            'alamat' => 'Jl. Dago Asri No. 18, Coblong, Bandung',
            'latitude' => -6.878500,
            'longitude' => 107.617500,
        ]);

        // 7. Produk Pangan Lokal
        $p1 = Product::create([
            'penjual_id' => $seller1->id,
            'nama_produk' => 'Beras Pandan Wangi Cianjur Premium',
            'kategori' => 'Beras & Biji-bijian',
            'harga' => 15000, // per kg
            'stok' => 500, // kg
            'minimum_pembelian' => 5, // min 5 kg
            'deskripsi' => 'Beras lokal kualitas unggul asli panen Cianjur. Pulen, wangi pandan alami, tanpa pemutih dan tanpa pengawet.',
            'status_aktif' => true,
            'foto' => 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
        ]);

        $p2 = Product::create([
            'penjual_id' => $seller1->id,
            'nama_produk' => 'Cabai Merah Keriting Petik Segar',
            'kategori' => 'Bumbu & Rempah',
            'harga' => 38000,
            'stok' => 80,
            'minimum_pembelian' => 1,
            'deskripsi' => 'Cabai merah keriting dipetik setiap pagi dari petani lokal Cibiru. Tingkat kepedasan mantap dan segar tahan lama.',
            'status_aktif' => true,
            'foto' => 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
        ]);

        $p3 = Product::create([
            'penjual_id' => $seller1->id,
            'nama_produk' => 'Telur Ayam Negeri Fresh Kandang',
            'kategori' => 'Daging & Telur',
            'harga' => 28000,
            'stok' => 200,
            'minimum_pembelian' => 2,
            'deskripsi' => 'Telur ayam negeri langsung dari peternakan lokal binaan. Cangkang tebal dan kuning telur padat bernutrisi tinggi.',
            'status_aktif' => true,
            'foto' => 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80',
        ]);

        $p4 = Product::create([
            'penjual_id' => $seller2->id,
            'nama_produk' => 'Kentang Granola Lembang Super',
            'kategori' => 'Sayuran',
            'harga' => 16000,
            'stok' => 350,
            'minimum_pembelian' => 3,
            'deskripsi' => 'Kentang dataran tinggi Lembang varietas Granola ukuran besar. Sangat cocok untuk perkedel, rendang, dan kentang goreng.',
            'status_aktif' => true,
            'foto' => 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
        ]);

        $p5 = Product::create([
            'penjual_id' => $seller2->id,
            'nama_produk' => 'Tomat Sayur Organik Lembang',
            'kategori' => 'Sayuran',
            'harga' => 12000,
            'stok' => 150,
            'minimum_pembelian' => 1,
            'deskripsi' => 'Tomat segar kebun Lembang bebas pestisida kimia berlebih. Merah merona, berair, dan kaya vitamin C.',
            'status_aktif' => true,
            'foto' => 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
        ]);

        $p6 = Product::create([
            'penjual_id' => $seller2->id,
            'nama_produk' => 'Bawang Merah Brebes Pilihan Grosir',
            'kategori' => 'Bumbu & Rempah',
            'harga' => 34000,
            'stok' => 120,
            'minimum_pembelian' => 5, // minimum grosir 5 kg
            'deskripsi' => 'Bawang merah Brebes kadar air rendah, aroma tajam sedap. Khusus pembelian grosir dengan harga lebih hemat.',
            'status_aktif' => true,
            'foto' => 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
        ]);

        // 8. Dummy Transaksi & Pesanan Berbagai Siklus Hidup (State Machine Testing)
        // Pesanan 1: Selesai + Payout Record sudah terkirim (FR-06, FR-08, UC-09, UC-11)
        $ord1 = Order::create([
            'nomor_pesanan' => 'ORD-20261110-001',
            'pembeli_id' => $buyer1->id,
            'penjual_id' => $seller1->id,
            'produk_id' => $p1->id,
            'kuantitas' => 10,
            'harga_satuan' => 15000,
            'total_bayar' => 150000,
            'tanggal_pesanan' => now()->subDays(6),
            'status_pesanan' => 'Selesai',
            'estimasi_sampai' => now()->subDays(3),
            'nomor_resi' => 'RESI-LOKAL-7712',
            'kurir' => 'Kurir Tani Mandiri',
            'alamat_tujuan' => $buyer1->alamat,
        ]);
        Payment::create([
            'pesanan_id' => $ord1->id,
            'nomor_transaksi' => 'PAY-20261110-001',
            'metode_pembayaran' => 'Transfer Bank BCA',
            'jumlah_bayar' => 150000,
            'status_pembayaran' => 'Berhasil',
            'status_dana' => 'Terkirim',
            'tanggal_pembayaran' => now()->subDays(6),
        ]);
        PayoutRecord::create([
            'pesanan_id' => $ord1->id,
            'penjual_id' => $seller1->id,
            'nominal' => 150000,
            'nomor_rekening' => $seller1->nomor_rekening,
            'nama_bank' => $seller1->nama_bank,
            'status_pencairan' => 'TERKIRIM',
            'tanggal_pencairan' => now()->subDays(3),
        ]);

        // Pesanan 2: Dikirim dan TERLAMBAT untuk pengujian UC-13 (Admin Daftar Keterlambatan)
        $ord2 = Order::create([
            'nomor_pesanan' => 'ORD-20261112-002',
            'pembeli_id' => $buyer1->id,
            'penjual_id' => $seller2->id,
            'produk_id' => $p4->id,
            'kuantitas' => 5,
            'harga_satuan' => 16000,
            'total_bayar' => 80000,
            'tanggal_pesanan' => now()->subDays(4),
            'status_pesanan' => 'Dikirim',
            'estimasi_sampai' => now()->subDays(1), // Melewati batas waktu estimasi -> Overdue!
            'nomor_resi' => 'EXP-LEMBANG-9011',
            'kurir' => 'J&T Express',
            'alamat_tujuan' => $buyer1->alamat,
        ]);
        Payment::create([
            'pesanan_id' => $ord2->id,
            'nomor_transaksi' => 'PAY-20261112-002',
            'metode_pembayaran' => 'Mandiri Virtual Account',
            'jumlah_bayar' => 80000,
            'status_pembayaran' => 'Berhasil',
            'status_dana' => 'Ditahan', // Dana masih di-HOLD oleh sistem escrow
            'tanggal_pembayaran' => now()->subDays(4),
        ]);

        // Pesanan 3: Dibayar (menunggu penjual memproses, dana masih hold)
        $ord3 = Order::create([
            'nomor_pesanan' => 'ORD-20261116-003',
            'pembeli_id' => $buyer1->id,
            'penjual_id' => $seller1->id,
            'produk_id' => $p2->id,
            'kuantitas' => 2,
            'harga_satuan' => 38000,
            'total_bayar' => 76000,
            'tanggal_pesanan' => now()->subHours(5),
            'status_pesanan' => 'Dibayar',
            'alamat_tujuan' => $buyer1->alamat,
        ]);
        Payment::create([
            'pesanan_id' => $ord3->id,
            'nomor_transaksi' => 'PAY-20261116-003',
            'metode_pembayaran' => 'QRIS',
            'jumlah_bayar' => 76000,
            'status_pembayaran' => 'Berhasil',
            'status_dana' => 'Ditahan', // Dana di-HOLD
            'tanggal_pembayaran' => now()->subHours(4),
        ]);

        // Pesanan 4: Menunggu Pembayaran (belum dibayar pembeli)
        $ord4 = Order::create([
            'nomor_pesanan' => 'ORD-20261117-004',
            'pembeli_id' => $buyer1->id,
            'penjual_id' => $seller1->id,
            'produk_id' => $p3->id,
            'kuantitas' => 3,
            'harga_satuan' => 28000,
            'total_bayar' => 84000,
            'tanggal_pesanan' => now()->subMinutes(30),
            'status_pesanan' => 'Menunggu Pembayaran',
            'batas_waktu_bayar' => now()->addHours(23),
            'alamat_tujuan' => $buyer1->alamat,
        ]);
        Payment::create([
            'pesanan_id' => $ord4->id,
            'nomor_transaksi' => 'PAY-20261117-004',
            'metode_pembayaran' => 'Transfer Bank BCA',
            'jumlah_bayar' => 84000,
            'status_pembayaran' => 'Menunggu',
            'status_dana' => 'Ditahan',
            'instruksi_pembayaran' => 'Silakan transfer sejumlah Rp 84.000 ke rekening virtual BCA 880192847192',
        ]);
    }
}
