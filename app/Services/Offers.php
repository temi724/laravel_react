<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PromotionType;
use App\Models\Bundle;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Sales;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * The deal of the day, drops and bundles: which special price applies to a product right now,
 * holding a unit for an order, and what the store shows.
 *
 * Units at a special price are counted when the order is placed (not when it is paid for), so a
 * limited drop cannot be oversold by orders that are still waiting for payment. If the payment
 * fails or is refunded the units are released again.
 */
final class Offers
{
    /**
     * The special price running on a product right now for a storage size, if any.
     * When a drop and the deal of the day overlap, the lower price wins.
     */
    public function liveFor(Product $product, ?string $storage): ?Promotion
    {
        return Promotion::query()->current()->started()
            ->where('product_id', $product->id)
            ->get()
            ->filter(fn (Promotion $promotion) => $promotion->isLive() && $this->sameStorage($promotion->storage, $storage))
            ->sortBy(fn (Promotion $promotion) => (float) $promotion->price)
            ->first();
    }

    /**
     * A drop that has not started yet. Until it does, the product is held back from sale.
     */
    public function upcomingDropFor(Product $product): ?Promotion
    {
        return Promotion::query()->current()->upcoming()
            ->where('type', PromotionType::Drop->value)
            ->where('product_id', $product->id)
            ->orderBy('starts_at')
            ->first();
    }

    /**
     * Hold units of a promotion for an order being placed. Returns the reason when it cannot.
     * Call inside a transaction: the row is locked so two orders cannot take the same units.
     */
    public function reserve(int $promotionId, int $quantity): ?string
    {
        $promotion = Promotion::query()->lockForUpdate()->find($promotionId);
        if (! $promotion || ! $promotion->isLive()) {
            return 'This offer has just ended. Remove the item from your cart and add it again.';
        }

        $what = $promotion->type === PromotionType::Drop ? 'drop' : 'deal';
        if ($promotion->per_order_limit !== null && $quantity > $promotion->per_order_limit) {
            return "This {$what} is limited to {$promotion->per_order_limit} per order.";
        }

        $remaining = $promotion->remaining();
        if ($remaining !== null && $quantity > $remaining) {
            return "Only {$remaining} left at the {$what} price.";
        }

        $promotion->increment('units_sold', $quantity);

        return null;
    }

    /**
     * Give back the units an order was holding (a failed or refunded payment, a cancelled order).
     */
    public function release(Sales $sale): void
    {
        DB::transaction(function () use ($sale) {
            $lines = is_array($sale->order_details) ? $sale->order_details : [];
            $changed = false;

            foreach ($lines as $index => $line) {
                if (! is_array($line) || empty($line['promotion_id']) || ! empty($line['promotion_released'])) {
                    continue;
                }

                $promotion = Promotion::query()->lockForUpdate()->find($line['promotion_id']);
                if ($promotion) {
                    $promotion->units_sold = max(0, $promotion->units_sold - max(1, (int) ($line['quantity'] ?? 1)));
                    $promotion->save();
                }

                $lines[$index]['promotion_released'] = true;
                $changed = true;
            }

            if ($changed) {
                $sale->order_details = $lines;
                $sale->save();
            }
        });
    }

    /**
     * Everything the store shows: today's deal, the drops that are live or coming, the bundles,
     * and, per product, the special price or the hold that applies right now.
     *
     * @return array<string, mixed>
     */
    public function storefront(): array
    {
        $promotions = Promotion::query()->current()->with('product.category')->orderBy('starts_at')->get()
            ->filter(fn (Promotion $promotion) => $promotion->product !== null)
            ->values();

        $live = $promotions->filter(fn (Promotion $promotion) => $promotion->isLive());

        return [
            'now' => now()->toIso8601String(),
            'deal_of_day' => ($deal = $live->first(fn (Promotion $promotion) => $promotion->type === PromotionType::DealOfDay && $promotion->product->in_stock))
                ? $this->present($deal)
                : null,
            'drops' => $promotions->filter(fn (Promotion $promotion) => $promotion->type === PromotionType::Drop)
                ->map(fn (Promotion $promotion) => $this->present($promotion))->values()->all(),
            'bundles' => $this->bundles()->map(fn (Bundle $bundle) => $this->presentBundle($bundle))->values()->all(),
            // Keyed by product id, for the product cards and the product page
            'prices' => (object) $live->groupBy('product_id')->map(
                fn (Collection $group) => $group->sortBy(fn (Promotion $promotion) => (float) $promotion->price)
                    ->map(fn (Promotion $promotion) => $this->present($promotion, withProduct: false))->values()->all()
            )->all(),
            'holds' => (object) $promotions
                ->filter(fn (Promotion $promotion) => $promotion->type === PromotionType::Drop && $promotion->status() === 'scheduled')
                ->keyBy('product_id')
                ->map(fn (Promotion $promotion) => $this->present($promotion, withProduct: false))->all(),
        ];
    }

    /**
     * Bundles that can be bought now: switched on, with every product still listed.
     *
     * @return Collection<int, Bundle>
     */
    public function bundles(): Collection
    {
        return Bundle::query()->active()->with('items.product.category')->latest()->latest('id')->get()
            ->filter(fn (Bundle $bundle) => $bundle->items->isNotEmpty() && $bundle->items->every(fn ($item) => $item->product !== null))
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    public function present(Promotion $promotion, bool $withProduct = true): array
    {
        $product = $promotion->product;
        $usual = $product?->priceFor($promotion->storage);

        $data = [
            'id' => $promotion->id,
            'type' => $promotion->type->value,
            'label' => $promotion->type->label(),
            'product_id' => (string) $promotion->product_id,
            'storage' => $promotion->storage,
            'price' => (float) $promotion->price,
            'usual_price' => $usual,
            'starts_at' => $promotion->starts_at?->toIso8601String(),
            'ends_at' => $promotion->ends_at?->toIso8601String(),
            'quantity_limit' => $promotion->quantity_limit,
            'remaining' => $promotion->remaining(),
            'per_order_limit' => $promotion->per_order_limit,
            'units_sold' => $promotion->units_sold,
            'headline' => $promotion->headline,
            'status' => $promotion->status(),
            'is_active' => $promotion->is_active,
        ];

        if ($withProduct && $product) {
            $data['product'] = $this->presentProduct($product);
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function presentBundle(Bundle $bundle): array
    {
        $items = $bundle->items->map(function ($item) {
            $product = $item->product;
            $unit = $product?->priceFor($item->storage);

            return [
                'product_id' => (string) $item->product_id,
                'storage' => $item->storage,
                'quantity' => $item->quantity,
                'unit_price' => $unit,
                'available' => $product !== null && $unit !== null && $product->in_stock && $product->stock_quantity >= $item->quantity,
                'product' => $product ? $this->presentProduct($product) : null,
            ];
        });

        $usual = (float) $items->sum(fn (array $item) => (float) ($item['unit_price'] ?? 0) * $item['quantity']);

        return [
            'id' => (string) $bundle->id,
            'name' => $bundle->name,
            'slug' => $bundle->slug,
            'url' => '/bundle/'.$bundle->slug,
            'description' => $bundle->description,
            'price' => (float) $bundle->price,
            'usual_price' => $usual,
            'saving' => max(0, round($usual - (float) $bundle->price, 2)),
            'is_active' => $bundle->is_active,
            'in_stock' => $items->every(fn (array $item) => $item['available']),
            'items' => $items->values()->all(),
        ];
    }

    /**
     * The few product details an offer needs to be shown.
     *
     * @return array<string, mixed>
     */
    private function presentProduct(Product $product): array
    {
        $images = is_array($product->images_url) ? $product->images_url : [];

        return [
            'id' => (string) $product->id,
            'product_name' => $product->product_name,
            'url' => $product->url,
            'price' => (float) $product->price,
            'image' => $images[0] ?? null,
            'images_url' => $images,
            'category' => $product->category?->name,
            'product_status' => $product->product_status,
            'in_stock' => $product->in_stock,
            'stock_quantity' => (int) $product->stock_quantity,
            'overview' => $product->overview,
            'storage_options' => $product->storage_options,
        ];
    }

    private function sameStorage(?string $a, ?string $b): bool
    {
        return strcasecmp(trim((string) $a), trim((string) $b)) === 0;
    }
}
