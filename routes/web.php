<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use App\Models\Product;
use Illuminate\Support\Facades\Log;

// cPanel-specific fix: prevent GET requests to Livewire upload endpoint
Route::get('/livewire/upload-file', function () {
    abort(404, 'File upload endpoint requires POST method.');
})->name('livewire.upload-file.blocked');

// CORE ROUTES - Essential for app functionality
Route::get('/', App\Http\Controllers\HomeController::class);

// What search engines and AI assistants read about the site
Route::get('/sitemap.xml', [App\Http\Controllers\StorePageController::class, 'sitemap'])->name('sitemap');
Route::get('/robots.txt', [App\Http\Controllers\StorePageController::class, 'robots']);
Route::get('/llms.txt', [App\Http\Controllers\StorePageController::class, 'llms']);

// Product listings: everything, and one page per category
Route::get('/products', [App\Http\Controllers\CatalogController::class, 'products'])->name('products.index');
Route::get('/category/{slug}', [App\Http\Controllers\CatalogController::class, 'category'])->name('category.show');

// The shop: where it is, how to reach it, common questions
Route::get('/about', [App\Http\Controllers\StorePageController::class, 'about'])->name('about');

// A product or flash deal. Its address is /product/{slug}, with no id in it. The old
// /product/{id}/{name} addresses, and the address a product had before it was renamed,
// are sent on to the current one with a permanent redirect (App\Support\ProductUrls).
Route::get('/product/{id}/{slug?}', function ($id, $slug = null) {
    $where = \App\Support\ProductUrls::shared()->locate($id, $slug);
    if (! $where) {
        abort(404);
    }
    if (isset($where['redirect'])) {
        return redirect($where['redirect'], 301);
    }

    $id = $where['id'];
    $type = $where['type'];

    // Cache product data for 30 minutes with eager loading
    $productData = cache()->remember("product.show.{$id}", 1800, function () use ($id, $type) {
        $product = $type === 'deal'
            ? \App\Models\Deal::with('category')->find($id)
            : Product::with('category')->find($id);

        return compact('product', 'type');
    });

    if (!$productData['product']) {
        abort(404);
    }

    return view('react.product-show', $productData);
})->name('product.show');

// A bundle: products that go together, sold for one price
Route::get('/bundle/{slug}', function (string $slug, \App\Services\Offers $offers) {
    $bundle = \App\Models\Bundle::query()->active()->with('items.product.category')->where('slug', $slug)->first();

    // A bundle whose product has been deleted can no longer be sold
    if (! $bundle || $bundle->items->isEmpty() || $bundle->items->contains(fn ($item) => $item->product === null)) {
        abort(404);
    }

    return view('bundle.show', ['bundle' => $offers->presentBundle($bundle)]);
})->name('bundle.show');

Route::get('/search', [App\Http\Controllers\CatalogController::class, 'search'])->name('search.results');

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
Route::post('/admin/logout', function (\Illuminate\Http\Request $request) {
    // End the session completely: a new id and a new CSRF token
    $request->session()->invalidate();
    $request->session()->regenerateToken();

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
})->where('filename', '[A-Za-z0-9_\-]+\.(jpg|jpeg|png|gif|webp)');

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
    })->middleware('admin.can:products.create')->name('admin.products.create');

    Route::get('/products/{product}/edit', function ($product) {
        return view('react.admin-products', ['mode' => 'edit', 'productId' => $product]);
    })->middleware('admin.can:products.edit')->name('admin.products.edit');

    Route::get('/sales', function () {
        return view('react.admin-sales');
    })->middleware('admin.can:sales.view')->name('admin.sales');

    Route::get('/orders', function () {
        return view('react.admin-orders');
    })->middleware('admin.can:sales.view')->name('admin.orders');

    // The deal of the day, drops and bundles
    Route::get('/offers', function () {
        return view('react.admin-offers');
    })->middleware('admin.can:offers.manage')->name('admin.offers');

    Route::get('/categories', function () {
        return view('react.admin-categories');
    })->middleware('admin.can:categories.manage')->name('admin.categories');

    // Settings: the super admin manages the other admins
    Route::get('/settings', function () {
        return view('react.admin-settings');
    })->middleware('admin.can:super')->name('admin.settings');

    Route::get('/invoice/{sale}', function ($saleId) {
        $sale = \App\Models\Sales::find($saleId);
        if (!$sale) {
            abort(404);
        }
        return view('admin.invoice', compact('sale'));
    })->middleware('admin.can:sales.view')->name('admin.invoice');

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

        // Embed only the glyphs the invoice uses, so the file stays small
        $pdf->getDomPDF()->getOptions()->set('isHtml5ParserEnabled', true);
        $pdf->getDomPDF()->getOptions()->set('isFontSubsettingEnabled', true);

        $number = $sale->order_id ?: $sale->receipt_number ?: $saleId;

        return $pdf->download("invoice-{$number}.pdf");
    })->middleware('admin.can:sales.view')->name('admin.invoice.pdf');
});
