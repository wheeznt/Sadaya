<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PayoutRecord;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Pastikan pengguna adalah admin
     */
    private function checkAdmin(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Akses khusus Administrator.');
        }
    }

    /**
     * UC-12: Kelola Data Pengguna - List Pengguna (FR-09)
     */
    public function users(Request $request)
    {
        $this->checkAdmin($request);

        $role = $request->query('role');
        $statusVerifikasi = $request->query('status_verifikasi');
        $statusAkun = $request->query('status_akun');

        $query = User::orderBy('id', 'desc');

        if (!empty($role)) {
            $query->where('role', $role);
        }

        if (!empty($statusVerifikasi)) {
            $query->where('status_verifikasi', $statusVerifikasi);
        }

        if (!empty($statusAkun)) {
            $query->where('status_akun', $statusAkun);
        }

        $users = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $users,
        ]);
    }

    /**
     * UC-12: Tindakan Pengelolaan Pengguna (Verifikasi, Blokir, Hapus)
     */
    public function manageUser(Request $request, $id)
    {
        $this->checkAdmin($request);

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        // Cegah admin memblokir/menghapus dirinya sendiri
        if ($user->id === $request->user()->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat melakukan tindakan terhadap akun sendiri.',
            ], 400);
        }

        $action = $request->input('action'); // 'verify', 'reject', 'block', 'unblock', 'delete'

        switch ($action) {
            case 'verify':
                $user->status_verifikasi = 'Terverifikasi';
                $user->save();
                $message = 'Akun penjual ' . ($user->nama_toko ?? $user->name) . ' berhasil diverifikasi.';
                break;

            case 'reject':
                $user->status_verifikasi = 'Ditolak';
                $user->save();
                $message = 'Verifikasi akun penjual ' . ($user->nama_toko ?? $user->name) . ' ditolak.';
                break;

            case 'block':
                $user->status_akun = 'Diblokir';
                $user->save();
                $message = 'Pengguna ' . $user->name . ' berhasil diblokir.';
                break;

            case 'unblock':
                $user->status_akun = 'Aktif';
                $user->save();
                $message = 'Pengguna ' . $user->name . ' berhasil diaktifkan kembali.';
                break;

            case 'delete':
                $name = $user->name;
                $user->delete();
                return response()->json([
                    'status' => 'success',
                    'message' => 'Akun pengguna ' . $name . ' berhasil dihapus permanen dari sistem.',
                ]);

            default:
                return response()->json([
                    'status' => 'error',
                    'message' => 'Aksi tidak valid.',
                ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $user->fresh(),
        ]);
    }

    /**
     * UC-13: Lihat Daftar Keterlambatan Transaksi (FR-10)
     * Pesanan yang berstatus 'Dikirim' dan telah melewati estimasi waktu sampai
     */
    public function overdueOrders(Request $request)
    {
        $this->checkAdmin($request);

        $overdueOrders = Order::with(['product', 'buyer', 'seller', 'payment'])
            ->where('status_pesanan', 'Dikirim')
            ->whereNotNull('estimasi_sampai')
            ->where('estimasi_sampai', '<', now())
            ->orderBy('estimasi_sampai', 'asc')
            ->get();

        $overdueData = $overdueOrders->map(function ($order) {
            $now = now();
            $estimasi = $order->estimasi_sampai;
            $diffHours = $estimasi->diffInHours($now, false);
            $diffDays = $estimasi->diffInDays($now, false);

            return [
                'id' => $order->id,
                'nomor_pesanan' => $order->nomor_pesanan,
                'nama_produk' => $order->product->nama_produk ?? '-',
                'pembeli' => $order->buyer->name ?? '-',
                'penjual' => $order->seller->nama_toko ?? $order->seller->name ?? '-',
                'kurir' => $order->kurir ?? 'Ekspedisi Lokal',
                'nomor_resi' => $order->nomor_resi ?? '-',
                'total_bayar' => $order->total_bayar,
                'tanggal_pesanan' => $order->tanggal_pesanan,
                'estimasi_sampai' => $order->estimasi_sampai,
                'terlambat_hari' => max(1, (int)$diffDays),
                'terlambat_jam' => max(1, (int)$diffHours),
            ];
        });

        return response()->json([
            'status' => 'success',
            'count' => $overdueData->count(),
            'data' => $overdueData,
        ]);
    }

    /**
     * UC-14: Kelola Transaksi & Rekapitulasi Laporan (FR-10)
     */
    public function reports(Request $request)
    {
        $this->checkAdmin($request);

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $status = $request->query('status');

        $query = Order::with(['product', 'buyer', 'seller', 'payment', 'payoutRecord'])
            ->orderBy('id', 'desc');

        if (!empty($startDate)) {
            $query->whereDate('tanggal_pesanan', '>=', $startDate);
        }

        if (!empty($endDate)) {
            $query->whereDate('tanggal_pesanan', '<=', $endDate);
        }

        if (!empty($status) && $status !== 'Semua') {
            $query->where('status_pesanan', $status);
        }

        $orders = $query->get();

        // Rekapitulasi statistik
        $totalTransaksi = $orders->count();
        $totalNominal = $orders->sum('total_bayar');

        $danaDitahan = Payment::where('status_dana', 'Ditahan')
            ->where('status_pembayaran', 'Berhasil')
            ->sum('jumlah_bayar');

        $danaDiteruskan = PayoutRecord::where('status_pencairan', 'TERKIRIM')
            ->sum('nominal');

        $statusSummary = [
            'Menunggu Pembayaran' => $orders->where('status_pesanan', 'Menunggu Pembayaran')->count(),
            'Dibayar' => $orders->where('status_pesanan', 'Dibayar')->count(),
            'Diproses' => $orders->where('status_pesanan', 'Diproses')->count(),
            'Dikirim' => $orders->where('status_pesanan', 'Dikirim')->count(),
            'Selesai' => $orders->where('status_pesanan', 'Selesai')->count(),
            'Dibatalkan' => $orders->where('status_pesanan', 'Dibatalkan')->count(),
        ];

        return response()->json([
            'status' => 'success',
            'summary' => [
                'total_transaksi' => $totalTransaksi,
                'total_nominal' => $totalNominal,
                'dana_ditahan' => $danaDitahan,
                'dana_diteruskan' => $danaDiteruskan,
                'status_summary' => $statusSummary,
            ],
            'data' => $orders,
        ]);
    }

    /**
     * Riwayat Pencairan Dana (Payout Records)
     */
    public function payouts(Request $request)
    {
        $this->checkAdmin($request);

        $payouts = PayoutRecord::with(['seller', 'order'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $payouts,
        ]);
    }
}
