<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Deal;
use App\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

/**
 * The storefront's product listing: products and flash deals together, filtered, sorted and
 * cut into pages. The products API and the pages that print their first products in the HTML
 * both read from here, so a page and the grid that takes it over always agree.
 */
final class Catalog
{
    public const PER_PAGE = 30;

    /**
     * @param  array{category_id?: mixed, min_price?: mixed, max_price?: mixed, status?: mixed, in_stock?: mixed}  $filters
     * @return array{data: Collection<int, Product|Deal>, current_page: int, last_page: int, per_page: int, total: int, from: int, to: int}
     */
    public function page(array $filters = [], int $page = 1, int $perPage = self::PER_PAGE, string $sortBy = 'created_at', string $direction = 'desc'): array
    {
        $products = Product::with('category');
        $deals = Deal::with('category');

        if (! empty($filters['category_id'])) {
            $products->where('category_id', $filters['category_id']);
            $deals->where('category_id', $filters['category_id']);
        }

        if (array_key_exists('min_price', $filters)) {
            $products->where('price', '>=', $filters['min_price']);
            $deals->where('price', '>=', $filters['min_price']);
        }

        if (array_key_exists('max_price', $filters)) {
            $products->where('price', '<=', $filters['max_price']);
            $deals->where('price', '<=', $filters['max_price']);
        }

        if (! empty($filters['status'])) {
            $products->productStatus($filters['status']);
            $deals->where('product_status', $filters['status']);
        }

        if (array_key_exists('in_stock', $filters)) {
            $products->inStock((bool) $filters['in_stock']);
            $deals->where('in_stock', (bool) $filters['in_stock']);
        }

        $combined = $products->get()->each(fn (Product $product) => $product->type = 'product')
            ->concat($deals->get()->each(fn (Deal $deal) => $deal->type = 'deal'))
            ->sortBy($sortBy, SORT_REGULAR, $direction === 'desc');

        $page = max(1, $page);
        $perPage = max(1, min($perPage, 100));
        $total = $combined->count();

        return [
            'data' => $combined->forPage($page, $perPage)->values(),
            'current_page' => $page,
            'last_page' => (int) ceil($total / $perPage),
            'per_page' => $perPage,
            'total' => $total,
            'from' => ($page - 1) * $perPage + 1,
            'to' => min($page * $perPage, $total),
        ];
    }

    /**
     * A few more products from the same category that can be bought now, newest first.
     *
     * @return Collection<int, Product>
     */
    public function related(Product|Deal $item, int $limit = 6): Collection
    {
        if (! $item->category_id) {
            return collect();
        }

        return Product::with('category')
            ->where('category_id', $item->category_id)
            ->when($item instanceof Product, fn ($query) => $query->where('id', '!=', $item->id))
            ->inStock()
            ->latest()
            ->latest('id')
            ->take($limit)
            ->get();
    }

    /**
     * What a product card needs and no more, for the listing a page hands to the grid.
     *
     * @return array<string, mixed>
     */
    public function card(Model $item): array
    {
        return [
            'id' => (string) $item->id,
            'type' => $item->type ?? ($item instanceof Deal ? 'deal' : 'product'),
            'product_name' => $item->product_name,
            'url' => $item->url,
            'price' => $item->price,
            'display_price' => $item->display_price,
            'old_price' => $item->old_price ?? null,
            'images_url' => array_slice((array) $item->images_url, 0, 1),
            'in_stock' => (bool) $item->in_stock,
            'product_status' => $item->product_status,
            'default_storage' => $item->default_storage,
            'storage_options' => $item->storage_options ?: [],
            'colors' => $item->colors ?: [],
            'category' => $item->category ? ['id' => (string) $item->category->id, 'name' => $item->category->name, 'slug' => $item->category->slug] : null,
        ];
    }

    /**
     * A page of the listing in the shape the grid starts from.
     *
     * @param  array<string, mixed>  $page  what page() returned
     * @return array<string, mixed>
     */
    public function forGrid(array $page): array
    {
        return ['data' => $page['data']->map(fn (Model $item) => $this->card($item))->all()] + $page;
    }
}
