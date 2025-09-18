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

Route::get('/', function () {
    return view('welcome');
});

Route::get('/product/{id}', function ($id) {
    // Try to find as product first
    $product = Product::with('category')->find($id);
    $type = 'product';

    // If not found as product, try as deal
    if (!$product) {
        $product = \App\Models\Deal::find($id);
        $type = 'deal';
    }

    // If neither found, return 404
    if (!$product) {
        abort(404);
    }

    return view('product.show', compact('product', 'type'));
})->name('product.show');

Route::get('/search', function () {
    return view('search.results');
})->name('search.results');

// Category filter route - redirects to search with category filter
Route::get('/category/{categoryName}', function ($categoryName) {
    $category = \App\Models\Category::where('name', $categoryName)->first();
    if (!$category) {
        return redirect('/')->with('error', 'Category not found');
    }
    return redirect()->route('search.results', ['category_id' => $category->id]);
})->name('category.filter');

Route::get('/cart', function () {
    return view('cart.index');
})->name('cart.index');

Route::get('/checkout', function () {
    return view('checkout.index');
})->name('checkout.index');

Route::get('/checkout/success', function () {
    return view('checkout.success');
})->name('checkout.success');

// Temporary debug route to add product to session for testing
Route::get('/debug/add-to-cart/{id}', function ($id) {
    $cart = session()->get('cart', []);
    if (isset($cart[$id])) {
        $cart[$id]['quantity'] += 1;
    } else {
        $cart[$id] = ['quantity' => 1];
    }
    session()->put('cart', $cart);
    return response()->json(['status' => 'ok', 'cart' => $cart]);
});

// API endpoint for cart count
Route::get('/api/cart/count', function () {
    $cart = session()->get('cart', []);
    $count = 0;
    foreach($cart as $item) {
        $count += is_array($item) ? ($item['quantity'] ?? 0) : $item;
    }
    return response()->json(['count' => $count]);
});

// Admin Routes
Route::get('/admin-access', function () {
    return view('admin.access');
})->name('admin.access');

// Admin Login Route (no middleware)
Route::get('/admin/login', App\Livewire\Admin\Login::class)->name('admin.login');

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

// Protected Admin Routes
Route::prefix('admin')->middleware('admin.auth')->group(function () {
    Route::get('/', App\Livewire\Admin\Dashboard::class)->name('admin.dashboard');
    Route::get('/dashboard', App\Livewire\Admin\Dashboard::class)->name('admin.dashboard.home');
    Route::get('/products', App\Livewire\Admin\ProductManager::class)->name('admin.products');
    Route::get('/products/create', App\Livewire\Admin\CreateProduct::class)->name('admin.products.create');
    Route::get('/products/{product}/edit', App\Livewire\Admin\EditProduct::class)->name('admin.products.edit');
    Route::get('/sales', App\Livewire\Admin\SalesManager::class)->name('admin.sales');
    Route::get('/orders', App\Livewire\Admin\OrderManager::class)->name('admin.orders');
    Route::get('/invoice/{sale}', function ($saleId) {
        $sale = \App\Models\Sales::find($saleId);
        if (!$sale) {
            abort(404);
        }
        return view('admin.invoice', compact('sale'));
    })->name('admin.invoice');
});
