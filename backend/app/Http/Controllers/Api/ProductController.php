<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * UC-03 & UC-04: Lihat Produk Terdekat & Cari Produk (FR-03, FR-04)
     */
    public function index(Request $request)
    {
        $keyword = $request->query('keyword');
        $category = $request->query('category');
        $userLat = $request->query('lat');
        $userLng = $request->query('lng');
        $maxRadius = $request->query('radius'); // in KM (optional)

        // Query produk aktif yang penjualnya terverifikasi dan aktif
        $query = Product::with(['seller' => function ($q) {
            $q->select('id', 'name', 'nama_toko', 'alamat_toko', 'latitude', 'longitude', 'phone');
        }])
        ->where('status_aktif', true)
        ->where('stok', '>', 0)
        ->whereHas('seller', function ($q) {
            $q->where('status_verifikasi', 'Terverifikasi')
              ->where('status_akun', 'Aktif');
        });

        // Filter kata kunci pencarian (UC-04)
        if (!empty($keyword)) {
            $query->where(function ($q) use ($keyword) {
                $q->where('nama_produk', 'like', "%{$keyword}%")
                  ->orWhere('deskripsi', 'like', "%{$keyword}%")
                  ->orWhere('kategori', 'like', "%{$keyword}%");
            });
        }

        // Filter kategori
        if (!empty($category) && $category !== 'Semua') {
            $query->where('kategori', $category);
        }

        $products = $query->get();

        // Hitung estimasi jarak jika koordinat pembeli tersedia (UC-03 Maps Service Simulation)
        $hasCoordinates = ($userLat !== null && $userLng !== null && is_numeric($userLat) && is_numeric($userLng));

        $productsWithDistance = $products->map(function ($product) use ($hasCoordinates, $userLat, $userLng) {
            $productArray = $product->toArray();

            if ($hasCoordinates && $product->seller && $product->seller->latitude !== null && $product->seller->longitude !== null) {
                $distance = $this->calculateHaversineDistance(
                    (float)$userLat,
                    (float)$userLng,
                    (float)$product->seller->latitude,
                    (float)$product->seller->longitude
                );
                $productArray['jarak_km'] = round($distance, 2);
            } else {
                $productArray['jarak_km'] = null;
            }

            return $productArray;
        });

        // Urutkan berdasarkan jarak jika koordinat aktif
        if ($hasCoordinates) {
            $productsWithDistance = $productsWithDistance->sortBy(function ($item) {
                return $item['jarak_km'] ?? 999999;
            })->values();

            // Filter radius jika diatur
            if ($maxRadius && is_numeric($maxRadius)) {
                $productsWithDistance = $productsWithDistance->filter(function ($item) use ($maxRadius) {
                    return $item['jarak_km'] !== null && $item['jarak_km'] <= (float)$maxRadius;
                })->values();
            }
        }

        return response()->json([
            'status' => 'success',
            'count' => $productsWithDistance->count(),
            'data' => $productsWithDistance,
        ]);
    }

    /**
     * UC-05: Lihat Informasi Produk (FR-04)
     */
    public function show(Request $request, $id)
    {
        $userLat = $request->query('lat');
        $userLng = $request->query('lng');

        $product = Product::with(['seller' => function ($q) {
            $q->select('id', 'name', 'nama_toko', 'alamat_toko', 'latitude', 'longitude', 'phone');
        }])->find($id);

        if (!$product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Produk tidak ditemukan atau tidak tersedia lagi.',
            ], 404);
        }

        $productArray = $product->toArray();

        if ($userLat !== null && $userLng !== null && $product->seller && $product->seller->latitude && $product->seller->longitude) {
            $productArray['jarak_km'] = round($this->calculateHaversineDistance(
                (float)$userLat,
                (float)$userLng,
                (float)$product->seller->latitude,
                (float)$product->seller->longitude
            ), 2);
        } else {
            $productArray['jarak_km'] = null;
        }

        return response()->json([
            'status' => 'success',
            'data' => $productArray,
        ]);
    }

    /**
     * UC-10: Produk Saya (Khusus Penjual)
     */
    public function myProducts(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'penjual') {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $products = Product::where('penjual_id', $user->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $products,
        ]);
    }

    /**
     * UC-10: Tambah Produk Baru (FR-07)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'penjual') {
            return response()->json(['message' => 'Hanya akun penjual yang dapat menambahkan produk.'], 403);
        }

        // Batasan: Penjual harus terverifikasi oleh Admin
        if ($user->status_verifikasi !== 'Terverifikasi') {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun penjual Anda masih berstatus ' . $user->status_verifikasi . '. Silakan verifikasi akun terlebih dahulu sebelum menambahkan produk.',
            ], 403);
        }

        $validated = $request->validate([
            'nama_produk' => 'required|string|max:255',
            'kategori' => 'required|string',
            'harga' => 'required|numeric|min:0',
            'stok' => 'required|integer|min:0',
            'minimum_pembelian' => 'required|integer|min:1',
            'deskripsi' => 'nullable|string',
            'foto' => 'nullable|string',
            'status_aktif' => 'nullable|boolean',
        ]);

        // Default foto jika kosong
        $fotoDefault = [
            'Beras & Biji-bijian' => 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
            'Sayuran' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
            'Buah-buahan' => 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80',
            'Daging & Telur' => 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80',
            'Bumbu & Rempah' => 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
        ];

        $foto = !empty($validated['foto'])
            ? $validated['foto']
            : ($fotoDefault[$validated['kategori']] ?? 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80');

        $product = Product::create([
            'penjual_id' => $user->id,
            'nama_produk' => $validated['nama_produk'],
            'kategori' => $validated['kategori'],
            'harga' => $validated['harga'],
            'stok' => $validated['stok'],
            'minimum_pembelian' => $validated['minimum_pembelian'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'foto' => $foto,
            'status_aktif' => $validated['status_aktif'] ?? true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Produk pangan berhasil ditambahkan ke lapak Anda.',
            'data' => $product,
        ], 201);
    }

    /**
     * UC-10: Ubah Informasi Produk (FR-07)
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $product = Product::where('penjual_id', $user->id)->find($id);

        if (!$product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Produk tidak ditemukan atau bukan milik Anda.',
            ], 404);
        }

        $validated = $request->validate([
            'nama_produk' => 'required|string|max:255',
            'kategori' => 'required|string',
            'harga' => 'required|numeric|min:0',
            'stok' => 'required|integer|min:0',
            'minimum_pembelian' => 'required|integer|min:1',
            'deskripsi' => 'nullable|string',
            'foto' => 'nullable|string',
            'status_aktif' => 'nullable|boolean',
        ]);

        $product->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Data produk berhasil diperbarui.',
            'data' => $product,
        ]);
    }

    /**
     * UC-10: Hapus Produk (FR-07)
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $product = Product::where('penjual_id', $user->id)->find($id);

        if (!$product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $product->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Produk berhasil dihapus dari lapak.',
        ]);
    }

    /**
     * Fitur Pintas Verifikasi Penjual Mandiri (Untuk Pengujian & Demo Sistem)
     */
    public function quickVerify(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'penjual') {
            return response()->json(['message' => 'Akses khusus akun penjual.'], 403);
        }

        $user->status_verifikasi = 'Terverifikasi';
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Selamat! Akun penjual Anda telah berhasil diverifikasi.',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Haversine formula to compute great-circle distance between two points in KM
     */
    private function calculateHaversineDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
