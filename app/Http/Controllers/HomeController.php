<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Deal;
use App\Models\Product;
use App\Services\Catalog;
use Illuminate\Contracts\View\View;

final class HomeController extends Controller
{
    /**
     * Storefront home: hero showcase, flash deals and the product grid.
     */
    public function __invoke(Catalog $catalog): View
    {
        return view('welcome', [
            // The first products of the grid, printed in the page so they are there before any script runs
            'listing' => $catalog->page(),
            // The id tie-break keeps the order stable when products share a created_at
            'showcase' => Product::inStock()->latest()->latest('id')->take(4)->get(),
            // The category is shown on each card, the same as in the product grid
            'deals' => Deal::with('category')->inStock()->latest()->latest('id')->take(12)->get(),
        ]);
    }
}
