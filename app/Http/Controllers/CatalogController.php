<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Helpers\Money;
use App\Models\Category;
use App\Models\Deal;
use App\Models\Product;
use App\Services\Catalog;
use App\Support\Seo;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * The pages that list products: everything, one category, or the results of a search.
 * The first products of a listing are printed in the page itself, so they are there for
 * shoppers and search engines before any script has run; the grid then takes over.
 */
final class CatalogController extends Controller
{
    public function __construct(private readonly Catalog $catalog) {}

    public function products(Request $request): View|RedirectResponse
    {
        $page = $this->pageNumber($request);
        if ($page === null) {
            return redirect('/products', 301);
        }

        $listing = $this->catalog->page([], $page);
        abort_if($page > 1 && $listing['data']->isEmpty(), 404);

        return view('catalog.listing', [
            'heading' => 'All products',
            'intro' => 'Laptops, phones, tablets, consoles and accessories, brand new and UK used. Pick up in Ikeja or have your order delivered anywhere in Nigeria.',
            'trail' => [['Home', '/'], ['All products', '/products']],
            'listing' => $listing,
            'pageBase' => '/products',
            'title' => Seo::title('All Gadgets: Laptops, Phones, Tablets & More'.$this->pageSuffix($page)),
            'description' => 'Browse every laptop, phone, tablet, console and accessory at '.Seo::storeName().' in Ikeja, Lagos. Brand new and UK used, with delivery to every state in Nigeria.',
        ]);
    }

    public function category(Request $request, string $slug): View|RedirectResponse
    {
        $category = Category::query()->where('slug', $slug)->firstOrFail();
        $path = Seo::categoryPath($category);

        $page = $this->pageNumber($request);
        if ($page === null) {
            return redirect($path, 301);
        }

        $listing = $this->catalog->page(['category_id' => $category->id], $page);
        abort_if($page > 1 && $listing['data']->isEmpty(), 404);

        $total = $listing['total'];
        $from = $total > 0 ? min(
            (float) (Product::where('category_id', $category->id)->min('price') ?? PHP_FLOAT_MAX),
            (float) (Deal::where('category_id', $category->id)->min('price') ?? PHP_FLOAT_MAX),
        ) : null;

        $counted = $total.' '.($total === 1 ? 'product' : 'products');

        return view('catalog.listing', [
            'heading' => $category->name,
            // The category's own description when it has one, else the facts of the listing
            'intro' => trim((string) $category->description) !== ''
                ? $category->description
                : ($total > 0
                    ? "{$counted} in {$category->name}, from ".Money::naira($from).'. Brand new and UK used, with store pickup in Ikeja and delivery anywhere in Nigeria.'
                    : null),
            'trail' => [['Home', '/'], [$category->name, $path]],
            'listing' => $listing,
            'pageBase' => $path,
            'categoryId' => (string) $category->id,
            'title' => Seo::title("Buy {$category->name} in Lagos, Nigeria".$this->pageSuffix($page)),
            'description' => $total > 0
                ? Seo::clip("Shop {$counted} in {$category->name} at ".Seo::storeName().', from '.Money::naira($from).'. Brand new and UK used. Pickup in Ikeja, Lagos or delivery anywhere in Nigeria.')
                : null,
            // A category with nothing in it is not worth a place in search results
            'robots' => $total === 0 ? 'noindex, follow' : null,
        ]);
    }

    /**
     * Search results stay out of search engines: there is one for every phrase anyone types.
     * The old category and "all products" addresses of this page now lead to their new ones.
     */
    public function search(Request $request): View|RedirectResponse
    {
        $query = trim((string) $request->query('q', ''));
        $categoryId = (string) $request->query('category_id', '');
        $category = ctype_digit($categoryId) ? Category::find($categoryId) : null;

        if ($query === '') {
            return redirect($category ? Seo::categoryPath($category) : '/products', 301);
        }

        return view('catalog.listing', [
            'heading' => 'Results for “'.$query.'”',
            'intro' => null,
            'trail' => [['Home', '/'], ['Search', '/search']],
            'listing' => null,
            'pageBase' => null,
            'searchQuery' => $query,
            'categoryId' => $category ? (string) $category->id : '',
            'title' => Seo::title($query.' - Search'),
            'description' => null,
            'robots' => 'noindex, follow',
        ]);
    }

    /** The page asked for: 1 when none is named, null when the address should be the plain one. */
    private function pageNumber(Request $request): ?int
    {
        if (! $request->has('page')) {
            return 1;
        }

        $page = $request->query('page');

        return is_string($page) && ctype_digit($page) && (int) $page > 1 ? (int) $page : null;
    }

    private function pageSuffix(int $page): string
    {
        return $page > 1 ? ', Page '.$page : '';
    }
}
