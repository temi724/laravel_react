<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductSpreadsheetController;
use App\Http\Controllers\Api\SalesController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminTeamController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\OrderController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Product API routes - Public routes
Route::get('products', [ProductController::class, 'index']);
Route::get('products/search', [ProductController::class, 'search']);
Route::get('products/suggestions', [ProductController::class, 'suggestions']);
Route::get('products/category/{categoryId}', [ProductController::class, 'productsByCategory']);
Route::get('products/{id}', [ProductController::class, 'show']);

// Category API routes - Public reads (the storefront lists categories)
Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);
Route::get('categories/{id}/products', [CategoryController::class, 'showWithProducts']);

// What is on offer right now: the deal of the day, drops and bundles (public)
Route::get('offers', [OfferController::class, 'storefront']);

// Analytics tracking routes - Public (no authentication required), limited per visitor
Route::middleware('throttle:analytics')->group(function () {
    Route::post('analytics/page-visit', [AdminController::class, 'trackPageVisit']);
    Route::post('analytics/product-view', [AdminController::class, 'trackProductView']);
    Route::post('analytics/session', [AdminController::class, 'trackSession']);
    Route::post('analytics/session-update', [AdminController::class, 'updateSessionActivity']);
    Route::post('analytics/checkout-event', [AdminController::class, 'trackCheckoutEvent']);
});

// Cart API routes - Need session support for cart storage
Route::middleware(['web'])->group(function () {
    Route::get('cart', [CartController::class, 'index']);
    Route::get('cart/count', [CartController::class, 'getCount']);
    Route::post('cart/add', [CartController::class, 'add']);
    Route::put('cart/update', [CartController::class, 'update']);
    Route::delete('cart/remove/{itemId}', [CartController::class, 'remove']);
    Route::delete('cart/clear', [CartController::class, 'clear']);
});

// Placing an order is public, limited per visitor
Route::post('orders/place', [OrderController::class, 'place'])->middleware('throttle:orders');

// Admin sign-in - Needs session support. The controller also locks out repeated wrong passwords.
Route::middleware(['web', 'throttle:admin-login'])->group(function () {
    Route::post('admin/login', [AdminController::class, 'login']);
});

// Everything below changes data or shows customer details: signed-in admins only.
// "web" starts the session the admin is recognised by (and checks the CSRF token).
// "admin.can:x" then asks for a permission the super admin switches on per admin (App\Enums\AdminPermission).
Route::middleware(['web', 'admin.auth'])->group(function () {
    // Any signed-in admin can look products up (the product screens and the in-store sale form need them)
    Route::get('admin/products', [AdminController::class, 'getProducts']);
    Route::get('admin/products/{id}', [AdminController::class, 'getProduct']);
    Route::get('admin/deals', [AdminController::class, 'getDeals']);

    Route::middleware('admin.can:products.create')->group(function () {
        // Listing many products at once from an Excel file, and the sample file that shows how
        Route::get('admin/products-import/sample', [ProductSpreadsheetController::class, 'sample']);
        Route::post('admin/products-import', [ProductSpreadsheetController::class, 'import']);

        Route::post('products', [ProductController::class, 'store']);
        Route::post('admin/products', [AdminController::class, 'createProduct']);
        Route::post('admin/deals', [AdminController::class, 'createDeal']);
    });

    Route::middleware('admin.can:products.edit')->group(function () {
        Route::put('products/{id}', [ProductController::class, 'update']);
        Route::patch('products/{id}', [ProductController::class, 'update']);
        Route::put('admin/products/{id}', [AdminController::class, 'updateProduct']);
        Route::put('admin/deals/{id}', [AdminController::class, 'updateDeal']);
    });

    Route::middleware('admin.can:products.delete')->group(function () {
        Route::delete('products/{id}', [ProductController::class, 'destroy']);
        Route::delete('admin/products/{id}', [AdminController::class, 'deleteProduct']);
        Route::delete('admin/deals/{id}', [AdminController::class, 'deleteDeal']);
    });

    Route::middleware('admin.can:products.export')->group(function () {
        Route::get('admin/products-export/fields', [ProductSpreadsheetController::class, 'fields']);
        Route::get('admin/products-export', [ProductSpreadsheetController::class, 'export']);
    });

    Route::middleware('admin.can:categories.manage')->group(function () {
        Route::get('admin/categories', [CategoryController::class, 'adminIndex']);
        Route::apiResource('categories', CategoryController::class)->only(['store', 'update', 'destroy']);
    });

    // The deal of the day, drops and bundles
    Route::middleware('admin.can:offers.manage')->group(function () {
        Route::get('admin/offers', [OfferController::class, 'index']);
        Route::post('admin/promotions', [OfferController::class, 'storePromotion']);
        Route::put('admin/promotions/{id}', [OfferController::class, 'updatePromotion']);
        Route::post('admin/promotions/{id}/end', [OfferController::class, 'endPromotion']);
        Route::delete('admin/promotions/{id}', [OfferController::class, 'destroyPromotion']);
        Route::post('admin/bundles', [OfferController::class, 'storeBundle']);
        Route::put('admin/bundles/{id}', [OfferController::class, 'updateBundle']);
        Route::delete('admin/bundles/{id}', [OfferController::class, 'destroyBundle']);
    });

    Route::middleware('admin.can:sales.view')->group(function () {
        Route::apiResource('sales', SalesController::class)->only(['index', 'show']);
        Route::get('orders/{orderId}', [OrderController::class, 'show']);
        Route::get('admin/sales', [AdminController::class, 'getSales']);
        Route::get('admin/sales/{id}', [AdminController::class, 'getSale']);
        Route::get('admin/sales/{id}/invoice', [AdminController::class, 'getInvoiceData']);
        Route::get('admin/offline-sales', [AdminController::class, 'getOfflineSales']);
    });

    Route::middleware('admin.can:sales.approve')->group(function () {
        Route::apiResource('sales', SalesController::class)->only(['store', 'update', 'destroy']);
        Route::put('orders/{orderId}/status', [OrderController::class, 'updateStatus']);
        Route::put('admin/sales/{id}/status', [AdminController::class, 'updateSaleStatus']);
        Route::put('admin/sales/{id}/payment-status', [AdminController::class, 'updateSalePaymentStatus']);
    });

    Route::post('admin/offline-sales', [AdminController::class, 'createOfflineSale'])->middleware('admin.can:sales.offline');

    Route::middleware('admin.can:reports.view')->group(function () {
        Route::get('admin/dashboard-stats', [AdminController::class, 'getDashboardStats']);
        Route::get('admin/monthly-sales', [AdminController::class, 'getMonthlySalesData']);
        Route::get('admin/top-selling', [AdminController::class, 'getTopSellingItems']);
        Route::get('admin/analytics/overview', [AdminController::class, 'getAnalyticsOverview']);
        Route::get('admin/analytics/traffic-sources', [AdminController::class, 'getTrafficSources']);
        Route::get('admin/analytics/conversion-funnel', [AdminController::class, 'getConversionFunnel']);
    });

    // Settings: only the super admin manages the other admins
    Route::middleware('admin.can:super')->group(function () {
        Route::get('admin/team', [AdminTeamController::class, 'index']);
        Route::post('admin/team', [AdminTeamController::class, 'store']);
        Route::put('admin/team/{id}', [AdminTeamController::class, 'update']);
        Route::put('admin/team/{id}/status', [AdminTeamController::class, 'status']);
    });
});
