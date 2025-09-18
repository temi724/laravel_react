<?php

// use App\Http\Controllers\AdminController as ControllersAdminController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SalesController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Product API routes - Public routes
Route::get('products', [ProductController::class, 'index']);
Route::get('products/search', [ProductController::class, 'search']);
Route::get('products/category/{categoryId}', [ProductController::class, 'productsByCategory']);
Route::get('products/{id}', [ProductController::class, 'show']);

// Cart API routes - Need session support for cart storage
Route::middleware(['web'])->group(function () {
    Route::get('cart', [CartController::class, 'index']);
    Route::get('cart/count', [CartController::class, 'getCount']);
    Route::post('cart/add', [CartController::class, 'add']);
    Route::put('cart/update', [CartController::class, 'update']);
    Route::put('cart/update-storage', [CartController::class, 'updateStorage']);
    Route::delete('cart/remove/{itemId}', [CartController::class, 'remove']);
    Route::delete('cart/clear', [CartController::class, 'clear']);
});

// Order API routes
Route::post('orders/place', [OrderController::class, 'place']);
Route::get('orders/{orderId}', [OrderController::class, 'show']);
Route::put('orders/{orderId}/status', [OrderController::class, 'updateStatus']);

// Product API routes - Admin protected routes
Route::middleware('admin.auth')->group(function () {
    Route::post('products', [ProductController::class, 'store']);
    Route::put('products/{id}', [ProductController::class, 'update']);
    Route::patch('products/{id}', [ProductController::class, 'update']);
    Route::delete('products/{id}', [ProductController::class, 'destroy']);
});


// Sales API routes
Route::apiResource('sales', SalesController::class);

// Category API routes
Route::apiResource('categories', CategoryController::class);
Route::get('categories/{id}/products', [CategoryController::class, 'showWithProducts']);

// Admin API routes
// Route::apiResource('admins', AdminController::class);
Route::post('admin/login', [AdminController::class, 'login']);
// Route::post('admin/create', [AdminController::class, 'store']);
// Custom routes if needed
// Route::get('/products/in-stock', [ProductController::class, 'inStock']);
// Route::post('/sales/{id}/add-product', [SalesController::class, 'addProduct']);
