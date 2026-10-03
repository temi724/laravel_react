<?php

declare(strict_types=1);

namespace App\View\Composers;

use App\Services\Offers;
use Illuminate\View\View;

final class StoreOffersComposer
{
    /**
     * The deal of the day, drops and bundles, for the storefront scripts on every page:
     * product cards and the product page read their special prices from it.
     */
    public function compose(View $view): void
    {
        $view->with('storeOffers', self::offers());
    }

    /**
     * Read once per request and kept in the container: the home page prints today's deal
     * from the same data the scripts are given.
     *
     * @return array<string, mixed>
     */
    public static function offers(): array
    {
        if (! app()->bound('store.offers')) {
            app()->instance('store.offers', app(Offers::class)->storefront());
        }

        return app('store.offers');
    }
}
