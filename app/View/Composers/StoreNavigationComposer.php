<?php

declare(strict_types=1);

namespace App\View\Composers;

use App\Models\Category;
use App\Models\Deal;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\View\View;

final class StoreNavigationComposer
{
    /**
     * Categories and the deals link, shared by the storefront header and the product grid.
     * A page that shows both reads the categories once.
     */
    public function compose(View $view): void
    {
        $view->with([
            'navCategories' => self::categories(),
            'navHasDeals' => Deal::inStock()->exists(),
        ]);
    }

    /**
     * Read once per request and kept in the container, which is rebuilt for every request.
     *
     * @return Collection<int, Category>
     */
    public static function categories(): Collection
    {
        if (! app()->bound('store.categories')) {
            app()->instance('store.categories', Category::query()->orderBy('name')->get(['id', 'name', 'slug', 'updated_at']));
        }

        return app('store.categories');
    }
}
