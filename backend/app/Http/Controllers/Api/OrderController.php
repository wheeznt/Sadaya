<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PayoutRecord;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * UC-06 & UC-07: Pesan Produk & Validasi Stok dan Minimum Pembelian (FR-05)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'pembeli') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya akun pembeli yang dapat membuat pesanan.',
            ], 403);
        }

        $validated = $request->validate([
            'produk_id' => 'required|exists:products,id',
            'kuantitas' => 'required|integer|min:1',
            'alamat_tujuan' => 'required|string',
            'metode_pembayaran' => 'required|string',
        ]);

        return DB::transaction(function () use ($user, $validated) {
            // Lock for update to prevent race conditions on stock
            $product = Product::lockForUpdate()->find($validated['produk_id']);

            if (!$product || !$product->status_aktif) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Produk tidak tersedia lagi.',
                ], 400);
            }

            // UC-07: Validasi batas minimum pembelian
            if ($validated['kuantitas'] < $product->minimum_pembelian) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Jumlah pembelian ({$validated['kuantitas']}) kurang dari batas minimum pembelian ({$product->minimum_pembelian}).",
                ], 422);
            }

            // UC-07: Validasi stok terkini
            if ($validated['kuantitas'] > $product->stok) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Stok produk tidak mencukupi. Sisa stok tersedia: {$product->stok}.",
                ], 422);
            }

            // Hitung total harga
            $hargaSatuan = $product->harga;
            $totalBayar = $hargaSatuan * $validated['kuantitas'];

            // Kurangi stok produk
            $product->stok -= $validated['kuantitas'];
            $product->save();

            // Generate nomor pesanan unik
            $nomorPesanan = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            // Buat pesanan baru
            $order = Order::create([
                'nomor_pesanan' => $nomorPesanan,
                'pembeli_id' => $user->id,
                'penjual_id' => $product->penjual_id,
                'produk_id' => $product->id,
                'kuantitas' => $validated['kuantitas'],
                'harga_satuan' => $hargaSatuan,
                'total_bayar' => $totalBayar,
                'tanggal_pesanan' => now(),
                'status_pesanan' => 'Menunggu Pembayaran',
                'batas_waktu_bayar' => now()->addHours(24),
                'alamat_tujuan' => $validated['alamat_tujuan'],
            ]);

            // Buat record pembayaran awal (UC-08)
            $nomorTransaksi = 'PAY-' . date('Ymd') . '-' . strtoupper(Str::random(6));
            $payment = Payment::create([
                'pesanan_id' => $order->id,
                'nomor_transaksi' => $nomorTransaksi,
                'metode_pembayaran' => $validated['metode_pembayaran'],
                'jumlah_bayar' => $totalBayar,
                'status_pembayaran' => 'Menunggu',
                'status_dana' => 'Ditahan', // Dana akan ditahan (escrow) saat dibayar
                'instruksi_pembayaran' => "Silakan transfer sejumlah Rp " . number_format($totalBayar, 0, ',', '.') . " melalui " . $validated['metode_pembayaran'] . " ke nomor rekening virtual 88019" . rand(10000000, 99999999),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Pesanan berhasil dibuat. Silakan selesaikan pembayaran.',
                'data' => [
                    'order' => $order->load(['product', 'seller', 'payment']),
                ],
            ], 201);
        });
    }

    /**
     * Riwayat Pesanan Pembeli (UC-06, UC-08, UC-09)
     */
    public function myOrders(Request $request)
    {
        $user = $request->user();

        $orders = Order::with(['product', 'seller', 'payment', 'payoutRecord'])
            ->where('pembeli_id', $user->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $orders,
        ]);
    }

    /**
     * Pesanan Masuk Penjual
     */
    public function sellerOrders(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'penjual') {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $orders = Order::with(['product', 'buyer', 'payment', 'payoutRecord'])
            ->where('penjual_id', $user->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $orders,
        ]);
    }

    /**
     * Detail Pesanan
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        $order = Order::with(['product', 'buyer', 'seller', 'payment', 'payoutRecord'])->find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        // Cek otorisasi
        if ($user->role !== 'admin' && $order->pembeli_id !== $user->id && $order->penjual_id !== $user->id) {
            return response()->json(['message' => 'Tidak memiliki hak akses ke pesanan ini.'], 403);
        }

        return response()->json([
            'status' => 'success',
            'data' => $order,
        ]);
    }

    /**
     * Batalkan Pesanan (Sebelum dibayar)
     */
    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        if ($order->pembeli_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        if ($order->status_pesanan !== 'Menunggu Pembayaran') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pesanan dengan status "' . $order->status_pesanan . '" tidak dapat dibatalkan.',
            ], 400);
        }

        return DB::transaction(function () use ($order, $request) {
            $order->status_pesanan = 'Dibatalkan';
            $order->alasan_batal = $request->input('alasan', 'Dibatalkan oleh pembeli');
            $order->save();

            // Kembalikan stok
            $product = Product::find($order->produk_id);
            if ($product) {
                $product->stok += $order->kuantitas;
                $product->save();
            }

            if ($order->payment) {
                $order->payment->status_pembayaran = 'Gagal';
                $order->payment->save();
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Pesanan berhasil dibatalkan dan stok dikembalikan.',
                'data' => $order->fresh(['product', 'payment']),
            ]);
        });
    }

    /**
     * Penjual: Proses Pesanan ('Dibayar' -> 'Diproses')
     */
    public function processOrder(Request $request, $id)
    {
        $user = $request->user();
        $order = Order::where('penjual_id', $user->id)->find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        if ($order->status_pesanan !== 'Dibayar') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya pesanan yang sudah dibayar yang dapat diproses.',
            ], 400);
        }

        $order->status_pesanan = 'Diproses';
        $order->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Pesanan berhasil diubah menjadi Diproses (penyiapan bahan pangan).',
            'data' => $order->fresh(),
        ]);
    }

    /**
     * Penjual: Kirim Pesanan ('Diproses' -> 'Dikirim')
     */
    public function shipOrder(Request $request, $id)
    {
        $user = $request->user();
        $order = Order::where('penjual_id', $user->id)->find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        if ($order->status_pesanan !== 'Diproses') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya pesanan berstatus Diproses yang dapat dikirimkan.',
            ], 400);
        }

        $validated = $request->validate([
            'kurir' => 'required|string',
            'nomor_resi' => 'nullable|string',
            'estimasi_hari' => 'nullable|integer|min:1',
        ]);

        $estimasiHari = $validated['estimasi_hari'] ?? 2;

        $order->status_pesanan = 'Dikirim';
        $order->kurir = $validated['kurir'];
        $order->nomor_resi = $validated['nomor_resi'] ?? ('RESI-' . rand(100000, 999999));
        $order->estimasi_sampai = now()->addDays($estimasiHari);
        $order->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Pesanan telah dikirimkan kepada pembeli.',
            'data' => $order->fresh(),
        ]);
    }

    /**
     * UC-09 & UC-11: Konfirmasi Pesanan Diterima & Teruskan Dana ke Penjual (FR-06, FR-08)
     */
    public function confirmReceived(Request $request, $id)
    {
        $user = $request->user();
        $order = Order::with(['seller', 'payment'])->where('pembeli_id', $user->id)->find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        // Exception: Jika statusnya bukan Dikirim atau sudah Selesai
        if (!in_array($order->status_pesanan, ['Dikirim', 'Diproses', 'Dibayar'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pesanan tidak dalam status yang dapat dikonfirmasi atau sudah diselesaikan.',
            ], 400);
        }

        return DB::transaction(function () use ($order) {
            // 1. Ubah status pesanan menjadi Selesai
            $order->status_pesanan = 'Selesai';
            $order->save();

            // 2. Teruskan dana: Ubah status pembayaran dari 'Ditahan' menjadi 'Terkirim'
            if ($order->payment) {
                $order->payment->status_dana = 'Terkirim';
                $order->payment->save();
            }

            // 3. Catat transaksi pencairan dana (payout record) ke penjual (UC-11)
            $payout = PayoutRecord::create([
                'pesanan_id' => $order->id,
                'penjual_id' => $order->penjual_id,
                'nominal' => $order->total_bayar,
                'nomor_rekening' => $order->seller->nomor_rekening ?? '1234567890',
                'nama_bank' => $order->seller->nama_bank ?? 'BCA',
                'status_pencairan' => 'TERKIRIM',
                'tanggal_pencairan' => now(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Konfirmasi pesanan diterima berhasil. Dana sebesar Rp ' . number_format($order->total_bayar, 0, ',', '.') . ' telah diteruskan ke rekening penjual (' . ($order->seller->nama_toko ?? $order->seller->name) . ').',
                'data' => [
                    'order' => $order->fresh(['product', 'seller', 'payment', 'payoutRecord']),
                    'payout' => $payout,
                ],
            ]);
        });
    }
}
