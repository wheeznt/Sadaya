<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * UC-01: Register (FR-01)
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:pembeli,penjual',
            'alamat' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'catatan_alamat' => 'nullable|string',
            // Informasi penjual (wajib diisi jika peran penjual)
            'nama_toko' => 'required_if:role,penjual|nullable|string|max:255',
            'alamat_toko' => 'nullable|string',
            'nomor_rekening' => 'required_if:role,penjual|nullable|string|max:50',
            'nama_bank' => 'required_if:role,penjual|nullable|string|max:50',
        ]);

        // Status awal berdasarkan peran (SRS Halaman 6: Pembeli langsung aktif, Penjual berstatus Menunggu Verifikasi admin)
        $statusVerifikasi = ($validated['role'] === 'penjual') ? 'Menunggu' : 'Terverifikasi';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'status_akun' => 'Aktif',
            'status_verifikasi' => $statusVerifikasi,
            'alamat' => $validated['alamat'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'catatan_alamat' => $validated['catatan_alamat'] ?? null,
            'nama_toko' => $validated['nama_toko'] ?? null,
            'alamat_toko' => $validated['alamat_toko'] ?? null,
            'nomor_rekening' => $validated['nomor_rekening'] ?? null,
            'nama_bank' => $validated['nama_bank'] ?? null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => ($validated['role'] === 'penjual')
                ? 'Registrasi penjual berhasil. Akun Anda sedang menunggu verifikasi oleh Admin.'
                : 'Registrasi pembeli berhasil.',
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    /**
     * UC-02: Login (FR-02)
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email atau kata sandi tidak valid.',
            ], 401);
        }

        // Cek status akun (Blokir)
        if ($user->status_akun === 'Diblokir') {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun Anda telah dinonaktifkan / diblokir oleh Administrator. Silakan hubungi admin.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => $user,
        ]);
    }

    /**
     * Get Current Authenticated User Profile
     */
    public function me(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'user' => $request->user(),
        ]);
    }

    /**
     * UC-15: Kelola Akun (FR-11)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'catatan_alamat' => 'nullable|string',
            'nama_toko' => 'nullable|string|max:255',
            'alamat_toko' => 'nullable|string',
            'nomor_rekening' => 'nullable|string|max:50',
            'nama_bank' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:6',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? $user->phone,
            'alamat' => $validated['alamat'] ?? $user->alamat,
            'latitude' => $validated['latitude'] ?? $user->latitude,
            'longitude' => $validated['longitude'] ?? $user->longitude,
            'catatan_alamat' => $validated['catatan_alamat'] ?? $user->catatan_alamat,
        ];

        if ($user->role === 'penjual') {
            $updateData['nama_toko'] = $validated['nama_toko'] ?? $user->nama_toko;
            $updateData['alamat_toko'] = $validated['alamat_toko'] ?? $user->alamat_toko;
            $updateData['nomor_rekening'] = $validated['nomor_rekening'] ?? $user->nomor_rekening;
            $updateData['nama_bank'] = $validated['nama_bank'] ?? $user->nama_bank;
        }

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return response()->json([
            'status' => 'success',
            'message' => 'Profil dan data akun berhasil diperbarui.',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil keluar dari sistem.',
        ]);
    }
}
