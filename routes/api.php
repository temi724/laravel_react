<?php

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

// Admin API routes - Need session support for login
Route::middleware(['web'])->group(function () {
    Route::post('admin/login', [AdminController::class, 'login']);
    Route::get('admin/debug-session', function() {
        return response()->json([
            'session_data' => [
                'admin_logged_in' => session('admin_logged_in'),
                'admin_id' => session('admin_id'),
                'admin_name' => session('admin_name'),
                'all_session' => session()->all()
            ]
        ]);
    });
});

// Protected admin routes - Need session support for authentication
Route::middleware(['web', 'admin.auth'])->group(function () {
    Route::get('admin/dashboard-stats', [AdminController::class, 'getDashboardStats']);
    Route::get('admin/products', [AdminController::class, 'getProducts']);
    Route::post('admin/products', [AdminController::class, 'createProduct']);
    Route::put('admin/products/{id}', [AdminController::class, 'updateProduct']);
    Route::delete('admin/products/{id}', [AdminController::class, 'deleteProduct']);
    Route::get('admin/deals', [AdminController::class, 'getDeals']);
    Route::post('admin/deals', [AdminController::class, 'createDeal']);
    Route::put('admin/deals/{id}', [AdminController::class, 'updateDeal']);
    Route::delete('admin/deals/{id}', [AdminController::class, 'deleteDeal']);
    Route::get('admin/sales', [AdminController::class, 'getSales']);
    Route::get('admin/sales/{id}', [AdminController::class, 'getSale']);
    Route::get('admin/sales/{id}/invoice', [AdminController::class, 'getInvoiceData']);
    Route::get('admin/monthly-sales', [AdminController::class, 'getMonthlySalesData']);
    Route::get('admin/top-selling', [AdminController::class, 'getTopSellingItems']);
    Route::put('admin/sales/{id}/status', [AdminController::class, 'updateSaleStatus']);
    Route::put('admin/sales/{id}/payment-status', [AdminController::class, 'updateSalePaymentStatus']);
});
// Custom routes if needed
// Route::get('/products/in-stock', [ProductController::class, 'inStock']);
// Route::post('/sales/{id}/add-product', [SalesController::class, 'addProduct']);
