<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Deal;
use App\Models\Product;
use App\Models\ProductSlug;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * The address of a product page: /product/apple-macbook-air-13-inch-m2, with no id in it.
 *
 * Each product and flash deal has one current address, made from its name. Two items with
 * the same name get "-deal" (a deal) or "-2", "-3". When a name changes the address follows
 * it, and the old address keeps working as a permanent redirect.
 *
 * Until the product_slugs table exists (its migration is run by hand) everything falls back
 * to the old /product/{id}/{name} addresses, so the store never depends on that step.
 */
final class ProductUrls
{
    public const PRODUCT = 'product';

    public const DEAL = 'deal';

    private const CACHE_KEY = 'product-urls.current';

    private const MAX_LENGTH = 80;

    private ?bool $ready = null;

    /** @var array<string, array<string, string>>|null */
    private ?array $map = null;

    /**
     * The one instance for the current request, so a page of products reads the address
     * list (and checks for the table) once.
     */
    public static function shared(): self
    {
        $app = app();
        if (! $app->bound(self::class)) {
            $app->scoped(self::class);
        }

        return $app->make(self::class);
    }

    /**
     * Whether the store has its own addresses yet.
     */
    public function ready(): bool
    {
        return $this->ready ??= Schema::hasTable('product_slugs');
    }

    /**
     * The path of an item's page.
     */
    public function path(Product|Deal $item): ?string
    {
        if (! $item->exists) {
            return null;
        }

        if (! $this->ready()) {
            return '/product/'.$item->getKey().'/'.Str::slug((string) $item->product_name);
        }

        $slug = $this->current()[$this->typeOf($item)][(string) $item->getKey()] ?? $this->sync($item);

        return '/product/'.$slug;
    }

    /**
     * What a slug in an address points to: the item and the slug it should be shown under.
     *
     * @return array{type: string, id: string, slug: string}|null
     */
    public function resolve(string $slug): ?array
    {
        if (! $this->ready()) {
            return null;
        }

        $row = ProductSlug::query()->where('slug', $slug)->first();
        if (! $row) {
            return null;
        }

        return [
            'type' => $row->item_type,
            'id' => $row->item_id,
            'slug' => $this->current()[$row->item_type][$row->item_id] ?? $row->slug,
        ];
    }

    /**
     * Where a /product/... address leads: the item to show, or the address the visitor should
     * be sent on to (an address from before slugs, or one from before a rename). Null when
     * there is no such product.
     *
     * @return array{id: string, type: string}|array{redirect: string}|null
     */
    public function locate(string $key, ?string $name = null): ?array
    {
        if (! $this->ready()) {
            // Before the store has its own addresses: /product/{id}/{name}
            $item = $this->findById($key);
            if (! $item) {
                return null;
            }
            $correct = Str::slug((string) $item->product_name);

            return $name === $correct
                ? ['id' => (string) $item->getKey(), 'type' => $this->typeOf($item)]
                : ['redirect' => "/product/{$key}/{$correct}"];
        }

        if ($name === null && ($found = $this->resolve($key))) {
            return $found['slug'] === $key
                ? ['id' => $found['id'], 'type' => $found['type']]
                : ['redirect' => '/product/'.$found['slug']];
        }

        $item = $this->findById($key);

        return $item ? ['redirect' => (string) $this->path($item)] : null;
    }

    /**
     * Make sure an item's current address matches its name. Returns the slug.
     */
    public function sync(Product|Deal $item): ?string
    {
        if (! $this->ready() || ! $item->exists) {
            return null;
        }

        $type = $this->typeOf($item);
        $id = (string) $item->getKey();
        $base = $this->baseSlug((string) $item->product_name);
        $current = $this->current()[$type][$id] ?? null;

        if ($current !== null && $this->belongsToName($current, $base)) {
            return $current;
        }

        $slug = $this->claim($type, $id, $base);
        $this->forgetCurrent();

        return $slug;
    }

    /**
     * An item was deleted: its addresses are free to be used again.
     */
    public function release(Product|Deal $item): void
    {
        if (! $this->ready()) {
            return;
        }

        ProductSlug::query()->where('item_type', $this->typeOf($item))->where('item_id', (string) $item->getKey())->delete();
        $this->forgetCurrent();
    }

    /**
     * Product ids are numbers and deal ids are 24 hex characters. Each is only ever looked up
     * in its own table, so "6abef5..." can never be read as product 6.
     */
    private function findById(string $id): Product|Deal|null
    {
        if (ctype_digit($id)) {
            return Product::query()->find($id);
        }

        return preg_match('/^[0-9a-f]{24}$/i', $id) === 1 ? Deal::query()->find($id) : null;
    }

    private function typeOf(Product|Deal $item): string
    {
        return $item instanceof Deal ? self::DEAL : self::PRODUCT;
    }

    /**
     * The name as it appears in an address: lower case, hyphens, cut at a word when long.
     */
    private function baseSlug(string $name): string
    {
        $slug = Str::slug($name);
        if (strlen($slug) > self::MAX_LENGTH) {
            $slug = rtrim(Str::beforeLast(substr($slug, 0, self::MAX_LENGTH + 1), '-'), '-');
        }

        return $slug !== '' ? $slug : 'product';
    }

    private function belongsToName(string $slug, string $base): bool
    {
        return $slug === $base || preg_match('/^'.preg_quote($base, '/').'-(deal|\d+)$/', $slug) === 1;
    }

    /**
     * Give the item an address made from $base: one it had before when there is one, the
     * first free one otherwise. The addresses it had until now stay, as redirects.
     */
    private function claim(string $type, string $id, string $base): string
    {
        $candidates = function () use ($type, $base) {
            yield $base;
            if ($type === self::DEAL) {
                yield $base.'-deal';
            }
            for ($suffix = 2; ; $suffix++) {
                yield $base.'-'.$suffix;
            }
        };

        foreach ($candidates() as $candidate) {
            $taken = ProductSlug::query()->where('slug', $candidate)->first();
            if ($taken && ($taken->item_type !== $type || $taken->item_id !== $id)) {
                continue;
            }

            try {
                DB::transaction(function () use ($type, $id, $candidate, $taken): void {
                    ProductSlug::query()->where('item_type', $type)->where('item_id', $id)->update(['is_current' => false]);

                    if ($taken) {
                        $taken->update(['is_current' => true]);
                    } else {
                        ProductSlug::create(['slug' => $candidate, 'item_type' => $type, 'item_id' => $id, 'is_current' => true]);
                    }
                });

                return $candidate;
            } catch (UniqueConstraintViolationException) {
                // Another request took this address in the meantime: try the next one
                continue;
            }
        }
    }

    /**
     * Every current address, by type and id. One query for a whole page of products.
     *
     * @return array<string, array<string, string>>
     */
    private function current(): array
    {
        return $this->map ??= cache()->remember(self::CACHE_KEY, 3600, function (): array {
            $map = [self::PRODUCT => [], self::DEAL => []];
            foreach (ProductSlug::query()->where('is_current', true)->get(['slug', 'item_type', 'item_id']) as $row) {
                $map[$row->item_type][$row->item_id] = $row->slug;
            }

            return $map;
        });
    }

    private function forgetCurrent(): void
    {
        $this->map = null;
        cache()->forget(self::CACHE_KEY);
    }
}
