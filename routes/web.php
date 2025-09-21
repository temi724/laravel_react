<?php

use Illuminate\Support\Facades\Route;
use App\Models\Product;
use Illuminate\Support\Facades\Log;

// cPanel-specific fix: Debug and prevent GET requests to Livewire upload endpoint
Route::get('/livewire/upload-file', function (\Illuminate\Http\Request $request) {
    // Log the request for debugging
    Log::info('GET request to Livewire upload endpoint detected', [
        'user_agent' => $request->userAgent(),
        'referer' => $request->header('referer'),
        'ip' => $request->ip(),
        'headers' => $request->headers->all()
    ]);

    abort(404, 'File upload endpoint requires POST method. Check browser behavior.');
})->name('livewire.upload-file.blocked');

// CORE ROUTES - Essential for app functionality
Route::get('/', function () {
    return view('welcome');
});

Route::get('/product/{id}', function ($id) {
    // Cache product data for 30 minutes with eager loading
    $cacheKey = "product.show.{$id}";

    $productData = cache()->remember($cacheKey, 1800, function () use ($id) {
        // Try to find as product first with eager loading
        $product = Product::with('category')->find($id);
        $type = 'product';

        // If not found as product, try as deal
        if (!$product) {
            $product = \App\Models\Deal::with('category')->find($id);
            $type = 'deal';
        }

        return compact('product', 'type');
    });

    // If neither found, return 404
    if (!$productData['product']) {
        abort(404);
    }

    return view('react.product-show', $productData);
})->name('product.show');

Route::get('/search', function () {
    return view('search.results');
})->name('search.results');

Route::get('/cart', function () {
    return view('cart.index');
})->name('cart.index');

// OPTIONAL ROUTES - Comment out if not needed
// Category filter route - redirects to search with category filter
// Route::get('/category/{categoryName}', function ($categoryName) {
//     $category = \App\Models\Category::where('name', $categoryName)->first();
//     if (!$category) {
//         return redirect('/')->with('error', 'Category not found');
//     }
//     return redirect()->route('search.results', ['category_id' => $category->id]);
// })->name('category.filter');

// CHECKOUT ROUTES
Route::get('/checkout', function () {
    return view('checkout.index');
})->name('checkout.index');

Route::get('/checkout/success', function () {
    return view('checkout.success');
})->name('checkout.success');

// DEBUG ROUTES - Comment out in production
// Temporary debug route to add product to session for testing
// Route::get('/debug/add-to-cart/{id}', function ($id) {
//     $cart = session()->get('cart', []);
//     if (isset($cart[$id])) {
//         $cart[$id]['quantity'] += 1;
//     } else {
//         $cart[$id] = ['quantity' => 1];
//     }
//     session()->put('cart', $cart);
//     return response()->json(['status' => 'ok', 'cart' => $cart]);
// });

// API endpoint for cart count
Route::get('/api/cart/count', function () {
    $cart = session()->get('cart', []);
    $count = 0;
    foreach($cart as $item) {
        $count += is_array($item) ? ($item['quantity'] ?? 0) : $item;
    }
    return response()->json(['count' => $count]);
});

// ADMIN ROUTES - Keep if you need admin functionality
Route::get('/admin-access', function () {
    return view('admin.access');
})->name('admin.access');

// Admin Login Route (no middleware) - Now React component
Route::get('/admin/login', function () {
    return view('react.admin-login');
})->name('admin.login');

// Admin Logout Route
Route::post('/admin/logout', function () {
    session()->flush();
    return redirect()->route('admin.login');
})->name('admin.logout');

// Fallback route for serving images if symlink doesn't work on cPanel
Route::get('/storage/products/{filename}', function ($filename) {
    $path = storage_path('app/public/products/' . $filename);

    if (!file_exists($path)) {
        abort(404);
    }

    $file = file_get_contents($path);
    $type = mime_content_type($path);

    return response($file, 200)->header('Content-Type', $type);
})->where('filename', '.*\.(jpg|jpeg|png|gif|svg)$');

// Protected Admin Routes - Now React components
Route::prefix('admin')->middleware(['web', 'admin.auth'])->group(function () {
    Route::get('/', function () {
        return view('react.admin-dashboard');
    })->name('admin.dashboard');

    Route::get('/dashboard', function () {
        return view('react.admin-dashboard');
    })->name('admin.dashboard.home');

    Route::get('/products', function () {
        return view('react.admin-products');
    })->name('admin.products');

    Route::get('/products/create', function () {
        return view('react.admin-products', ['mode' => 'create']);
    })->name('admin.products.create');

    Route::get('/products/{product}/edit', function ($product) {
        return view('react.admin-products', ['mode' => 'edit', 'productId' => $product]);
    })->name('admin.products.edit');

    Route::get('/sales', function () {
        return view('react.admin-sales');
    })->name('admin.sales');

    Route::get('/orders', function () {
        return view('react.admin-orders');
    })->name('admin.orders');

    Route::get('/invoice/{sale}', function ($saleId) {
        $sale = \App\Models\Sales::find($saleId);
        if (!$sale) {
            abort(404);
        }
        return view('admin.invoice', compact('sale'));
    })->name('admin.invoice');

    Route::get('/invoice/{sale}/pdf', function ($saleId) {
        $sale = \App\Models\Sales::find($saleId);
        if (!$sale) {
            abort(404);
        }

        // Parse order details and calculate total
        $orderDetails = $sale->order_details ?: [];
        $total = collect($orderDetails)->sum('subtotal');

        // Add calculated total to sale object for the view
        $sale->calculated_total = $total;

        // Generate PDF using DomPDF with proper facade and UTF-8 encoding
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.invoice-pdf', compact('sale', 'orderDetails', 'total'));

        // Set UTF-8 encoding options
        $pdf->getDomPDF()->getOptions()->set('isHtml5ParserEnabled', true);
        $pdf->getDomPDF()->getOptions()->set('isPhpEnabled', true);

        return $pdf->download("invoice-{$saleId}.pdf");
    })->name('admin.invoice.pdf');
});
