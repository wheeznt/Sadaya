<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes untuk Sadaya - Marketplace Pangan Lokal
| Sesuai SRS Rekayasa Perangkat Lunak UPI Cibiru
|--------------------------------------------------------------------------
*/

// Public Authentication Routes (UC-01, UC-02)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public Product Catalog Routes (UC-03, UC-04, UC-05)
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Protected Routes (Harus Login)
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile Management (UC-15)
    Route::get('/user', [AuthController::class, 'me']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Penjual: Product Management (UC-10)
    Route::get('/seller/products', [ProductController::class, 'myProducts']);
    Route::post('/seller/products', [ProductController::class, 'store']);
    Route::put('/seller/products/{id}', [ProductController::class, 'update']);
    Route::delete('/seller/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/seller/quick-verify', [ProductController::class, 'quickVerify']);

    // Penjual: Order Processing & Shipping
    Route::get('/seller/orders', [OrderController::class, 'sellerOrders']);
    Route::post('/seller/orders/{id}/process', [OrderController::class, 'processOrder']);
    Route::post('/seller/orders/{id}/ship', [OrderController::class, 'shipOrder']);

    // Pembeli: Orders & Transactions (UC-06, UC-07, UC-09, UC-11)
    Route::get('/buyer/orders', [OrderController::class, 'myOrders']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{id}/confirm-received', [OrderController::class, 'confirmReceived']);

    // Payment Gateway Simulation (UC-08)
    Route::post('/orders/{id}/pay', [PaymentController::class, 'pay']);
    Route::post('/orders/{id}/simulate-fail', [PaymentController::class, 'simulateFailure']);

    // Admin Management & Reports (UC-12, UC-13, UC-14)
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::post('/admin/users/{id}/action', [AdminController::class, 'manageUser']);
    Route::get('/admin/overdue-orders', [AdminController::class, 'overdueOrders']);
    Route::get('/admin/reports', [AdminController::class, 'reports']);
    Route::get('/admin/payouts', [AdminController::class, 'payouts']);
});
