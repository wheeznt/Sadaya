<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/products', function () {
    return [
        ['id' => 1, 'name' => 'Sepatu', 'price' => 250000],
        ['id' => 2, 'name' => 'Tas', 'price' => 180000],
    ];
});