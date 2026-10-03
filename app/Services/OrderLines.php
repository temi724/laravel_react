<?php

declare(strict_types=1);

namespace App\Services;

use App\Helpers\Money;
use App\Models\Bundle;
use App\Models\Deal;
use App\Models\Product;
use Illuminate\Support\Str;

/**
 * Turns what a cart asks for into order lines priced from the database.
 *
 * The browser says which items, sizes and quantities the customer wants. Names, prices, offers
 * and stock always come from here: a price sent by the browser is only compared with the real
 * one, so a changed or tampered cart is refused instead of being charged wrongly.
 */
final class OrderLines
{
    /** Units asked for so far, per product: one product can be on several lines and inside bundles */
    private array $wanted = [];

    public function __construct(private readonly Offers $offers) {}

    /**
     * @param  list<array<string, mixed>>  $items  validated cart items
     * @param  list<string>  $shownNames  the name the customer saw for each item, for the messages
     * @return array{lines: list<array<string, mixed>>, problems: list<string>}
     */
    public function price(array $items, array $shownNames): array
    {
        $this->wanted = [];
        $lines = [];
        $problems = [];

        foreach (array_values($items) as $index => $item) {
            $shown = Str::limit((string) ($shownNames[$index] ?? 'An item in your cart'), 80);
            $line = ($item['type'] ?? null) === 'bundle' ? $this->bundle($item, $shown) : $this->product($item, $shown);

            if (isset($line['problem'])) {
                $problems[] = $line['problem'];
            } else {
                $lines[] = $line;
            }
        }

        return ['lines' => $lines, 'problems' => $problems];
    }

    /**
     * One product (or flash deal) line.
     *
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function product(array $item, string $shownName): array
    {
        // Try to find as product first, then as deal
        $product = Product::find($item['id']);
        $type = 'product';
        if (! $product) {
            $product = Deal::find($item['id']);
            $type = 'deal';
        }

        if (! $product) {
            return ['problem' => "{$shownName} is no longer available. Remove it from your cart to continue."];
        }

        $name = $product->product_name;
        $quantity = (int) $item['quantity'];
        $storage = isset($item['selected_storage']) && trim((string) $item['selected_storage']) !== '' ? (string) $item['selected_storage'] : null;

        if (! $product->in_stock) {
            return ['problem' => "{$name} is out of stock. Remove it from your cart to continue."];
        }

        $promotion = null;
        if ($product instanceof Product) {
            // A product waiting for its drop is not on sale yet
            if ($drop = $this->offers->upcomingDropFor($product)) {
                return ['problem' => "{$name} goes on sale when its drop starts. Remove it from your cart to continue."];
            }

            if ($problem = $this->take($product, $quantity)) {
                return ['problem' => $problem];
            }

            $price = $product->priceFor($storage);
            $promotion = $this->offers->liveFor($product, $storage);
        } else {
            $price = $this->dealPrice($product, $storage);
        }

        if ($price === null) {
            return ['problem' => "{$name} is no longer sold in {$storage}. Remove it from your cart and add it again."];
        }

        $storagePrice = $storage !== null ? $price : null;

        if ($promotion) {
            $what = $promotion->type->label();
            if ($promotion->per_order_limit !== null && $quantity > $promotion->per_order_limit) {
                return ['problem' => "{$name} is limited to {$promotion->per_order_limit} per order at the ".mb_strtolower($what).' price.'];
            }
            if ($promotion->remaining() !== null && $quantity > $promotion->remaining()) {
                return ['problem' => "Only {$promotion->remaining()} of {$name} left at the ".mb_strtolower($what).' price. Reduce the quantity in your cart.'];
            }

            $price = (float) $promotion->price;
        }

        // The customer agreed to the price in their cart. If it is not the real price, they choose again.
        if (isset($item['price']) && abs((float) $item['price'] - $price) >= 1) {
            return ['problem' => "The price of {$name} is now ".Money::naira($price).'. Remove it from your cart and add it again.'];
        }

        $images = $product->images_url;

        $line = [
            'id' => (string) $product->id,
            'type' => $type,
            'name' => $name,
            'price' => $price,
            'quantity' => $quantity,
            'subtotal' => round($price * $quantity, 2),
            'image' => is_array($images) && isset($images[0]) ? $images[0] : null,
        ];

        // Add storage and color selections if available
        if ($storage !== null) {
            $line['selected_storage'] = $storage;
            $line['storage_price'] = $storagePrice;
        }
        if (! empty($item['selected_color'])) {
            $line['selected_color'] = $item['selected_color'];
        }
        if ($promotion) {
            $line['promotion_id'] = $promotion->id;
            $line['promotion_type'] = $promotion->type->value;
            $line['promotion_label'] = $promotion->type->label();
        }

        return $line;
    }

    /**
     * One bundle line: several products for one price. The line lists its products, so stock and
     * serial numbers can be handled per product when the order is confirmed.
     *
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function bundle(array $item, string $shownName): array
    {
        $bundle = Bundle::query()->active()->with('items.product')->find($item['id']);
        if (! $bundle || $bundle->items->isEmpty()) {
            return ['problem' => "{$shownName} is no longer available. Remove it from your cart to continue."];
        }

        $quantity = (int) $item['quantity'];
        $components = [];

        foreach ($bundle->items as $part) {
            $product = $part->product;
            if (! $product || ! $product->in_stock || $product->priceFor($part->storage) === null) {
                return ['problem' => "{$bundle->name} cannot be bought right now: one of its items is out of stock. Remove it from your cart to continue."];
            }

            if ($this->offers->upcomingDropFor($product)) {
                return ['problem' => "{$bundle->name} cannot be bought yet: {$product->product_name} goes on sale when its drop starts."];
            }

            if ($this->take($product, $part->quantity * $quantity)) {
                return ['problem' => "There is not enough stock for {$quantity} of {$bundle->name}. Reduce the quantity in your cart."];
            }

            $components[] = array_filter([
                'id' => (string) $product->id,
                'name' => $product->product_name,
                'quantity' => $part->quantity, // per bundle
                'storage' => $part->storage,
            ], fn ($value) => $value !== null);
        }

        $price = (float) $bundle->price;
        if (isset($item['price']) && abs((float) $item['price'] - $price) >= 1) {
            return ['problem' => "The price of {$bundle->name} is now ".Money::naira($price).'. Remove it from your cart and add it again.'];
        }

        $firstImages = $bundle->items->first()->product->images_url;

        return [
            'id' => (string) $bundle->id,
            'type' => 'bundle',
            'name' => $bundle->name,
            'price' => $price,
            'quantity' => $quantity,
            'subtotal' => round($price * $quantity, 2),
            'image' => is_array($firstImages) && isset($firstImages[0]) ? $firstImages[0] : null,
            'components' => $components,
        ];
    }

    /**
     * Count units of a product towards this order. Returns the problem when there are not enough.
     */
    private function take(Product $product, int $units): ?string
    {
        $left = (int) $product->stock_quantity;
        $this->wanted[$product->id] = ($this->wanted[$product->id] ?? 0) + $units;

        return $this->wanted[$product->id] > $left
            ? "Only {$left} of {$product->product_name} left in stock. Reduce the quantity in your cart."
            : null;
    }

    private function dealPrice(Deal $deal, ?string $storage): ?float
    {
        if ($storage === null) {
            return (float) $deal->price;
        }

        foreach ($deal->storage_options as $option) {
            if (is_array($option) && strcasecmp(trim((string) ($option['storage'] ?? '')), trim($storage)) === 0) {
                return (float) ($option['price'] ?? 0) ?: (float) $deal->price;
            }
        }

        return null;
    }
}
