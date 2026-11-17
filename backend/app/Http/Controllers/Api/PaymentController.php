<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * UC-08: Bayar Pesanan (Simulasi Payment Gateway)
     */
    public function pay(Request $request, $orderId)
    {
        $user = $request->user();
        $order = Order::with('payment')->find($orderId);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        // Boleh dibayar oleh pembeli pemilik, atau penjual penerima, atau admin (untuk simulasi gateway)
        if ($order->pembeli_id !== $user->id && $order->penjual_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        if ($order->status_pesanan !== 'Menunggu Pembayaran') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pesanan ini tidak dalam status menunggu pembayaran.',
            ], 400);
        }

        $validated = $request->validate([
            'metode_pembayaran' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($order, $validated) {
            // Update pesanan menjadi Dibayar
            $order->status_pesanan = 'Dibayar';
            $order->save();

            // Update status pembayaran menjadi Berhasil & dana ditahan (hold)
            $payment = $order->payment;
            if ($payment) {
                if (!empty($validated['metode_pembayaran'])) {
                    $payment->metode_pembayaran = $validated['metode_pembayaran'];
                }
                $payment->status_pembayaran = 'Berhasil';
                $payment->status_dana = 'Ditahan'; // Escrow hold
                $payment->tanggal_pembayaran = now();
                $payment->save();
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Pembayaran berhasil diverifikasi. Dana Anda aman ditahan sistem hingga pesanan diterima.',
                'data' => [
                    'order' => $order->fresh(['product', 'seller', 'payment']),
                ],
            ]);
        });
    }

    /**
     * Simulasi Pembayaran Gagal / Kedaluwarsa
     */
    public function simulateFailure(Request $request, $orderId)
    {
        $user = $request->user();
        $order = Order::with('payment')->find($orderId);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
        }

        if ($order->status_pesanan !== 'Menunggu Pembayaran') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pesanan sudah diproses sebelumnya.',
            ], 400);
        }

        return DB::transaction(function () use ($order) {
            $order->status_pesanan = 'Dibatalkan';
            $order->alasan_batal = 'Pembayaran gagal atau batas waktu kedaluwarsa';
            $order->save();

            // Kembalikan stok
            $product = Product::find($order->produk_id);
            if ($product) {
                $product->stok += $order->kuantitas;
                $product->save();
            }

            if ($order->payment) {
                $order->payment->status_pembayaran = 'Kedaluwarsa';
                $order->payment->save();
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Pembayaran kedaluwarsa/gagal. Pesanan otomatis dibatalkan dan stok dikembalikan.',
                'data' => $order->fresh(['payment']),
            ]);
        });
    }
}
