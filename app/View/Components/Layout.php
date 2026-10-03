<?php

declare(strict_types=1);

namespace App\View\Components;

use App\Support\Seo;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

/**
 * The storefront page shell. What a search engine reads about a page is set through it:
 *
 *   title        the full title (Seo::title() adds the shop's name)
 *   description  one or two sentences, under 160 characters
 *   canonical    the page's one address; left out, it is the current path with no query string
 *   robots       "noindex, follow" for pages that stay out of search (cart, checkout, search results)
 *   image        the picture a shared link shows
 *   ogType       "website", or "product" on a product page
 *   schema       schema.org nodes for the page (see App\Support\Seo)
 */
final class Layout extends Component
{
    public string $title;

    public string $description;

    public string $canonical;

    public string $robots;

    public bool $indexable;

    public ?string $image;

    /**
     * @param  list<array<string, mixed>>  $schema
     */
    public function __construct(
        ?string $title = null,
        ?string $description = null,
        ?string $canonical = null,
        ?string $robots = null,
        ?string $image = null,
        public string $ogType = 'website',
        public array $schema = [],
    ) {
        $this->title = trim((string) $title) ?: (string) config('store.seo.home_title');
        $this->description = trim((string) $description) ?: (string) config('store.seo.description');
        $this->canonical = $canonical ?: Seo::url(request()->getPathInfo());
        $this->robots = $robots ?: 'index, follow, max-image-preview:large, max-snippet:-1';
        $this->indexable = ! str_contains($this->robots, 'noindex');
        $this->image = $image ?: Seo::defaultImage();
    }

    public function render(): View
    {
        return view('components.layout');
    }
}
