<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\InsufficientStock;
use App\Helpers\SerialNumbers;
use App\Models\Product;
use App\Models\Sales;
use Illuminate\Support\Facades\DB;

/**
 * Moves units between the shelf and a sale.
 *
 * A product holds its stock count and the serial numbers of the units still on the shelf.
 * When a sale is confirmed its units leave the shelf: the count goes down, the product's
 * number sold goes up, and the serial numbers that leave are written onto the sale's line
 * (order_details[].serial_numbers), which is what invoices and receipts print. Each line is marked "stock_deducted" so it is
 * never taken twice.
 */
final class Inventory
{
    /**
     * Take every product on the sale out of stock, first listed serial numbers first.
     * A bundle line takes each of the products inside it. Nothing changes if any line cannot be met.
     *
     * @throws InsufficientStock
     */
    public static function deduct(Sales $sale): void
    {
        DB::transaction(function () use ($sale) {
            $lines = self::lines($sale);
            $changed = false;

            foreach ($lines as $index => $line) {
                if (! empty($line['stock_deducted'])) {
                    continue;
                }

                if (self::isBundleLine($line)) {
                    $bundles = max(1, (int) ($line['quantity'] ?? 1));
                    foreach ($line['components'] as $position => $component) {
                        $taken = self::takeFromShelf($component, max(1, (int) ($component['quantity'] ?? 1)) * $bundles);
                        if ($taken !== null) {
                            $lines[$index]['components'][$position]['serial_numbers'] = $taken;
                        }
                    }
                } elseif (self::isStockLine($line)) {
                    $taken = self::takeFromShelf($line, max(1, (int) ($line['quantity'] ?? 1)));
                    if ($taken === null) {
                        continue; // the product has since been deleted: nothing to take from
                    }
                    $lines[$index]['serial_numbers'] = $taken;
                } else {
                    continue;
                }

                $lines[$index]['stock_deducted'] = true;
                $changed = true;
            }

            if ($changed) {
                $sale->order_details = $lines;
                $sale->save();
            }
        });
    }

    /**
     * Put a sale's units back on the shelf (a failed or refunded payment, a cancelled order).
     */
    public static function restore(Sales $sale): void
    {
        DB::transaction(function () use ($sale) {
            $lines = self::lines($sale);
            $changed = false;

            foreach ($lines as $index => $line) {
                if (empty($line['stock_deducted'])) {
                    continue;
                }

                if (self::isBundleLine($line)) {
                    $bundles = max(1, (int) ($line['quantity'] ?? 1));
                    foreach ($line['components'] as $position => $component) {
                        self::returnToShelf($component, max(1, (int) ($component['quantity'] ?? 1)) * $bundles);
                        $lines[$index]['components'][$position]['serial_numbers'] = [];
                    }
                } else {
                    if (self::isStockLine($line)) {
                        self::returnToShelf($line, max(1, (int) ($line['quantity'] ?? 1)));
                    }
                    $lines[$index]['serial_numbers'] = [];
                }

                unset($lines[$index]['stock_deducted']);
                $changed = true;
            }

            if ($changed) {
                $sale->order_details = $lines;
                $sale->save();
            }
        });
    }

    /**
     * Take units of one product off the shelf and return the serial numbers that left with them.
     * Null when the product no longer exists.
     *
     * @param  array<string, mixed>  $entry  an order line, or one product inside a bundle line
     * @return list<string>|null
     *
     * @throws InsufficientStock
     */
    private static function takeFromShelf(array $entry, int $quantity): ?array
    {
        $product = Product::whereKey($entry['id'] ?? null)->lockForUpdate()->first();
        if (! $product) {
            return null;
        }

        $inStock = (int) $product->stock_quantity;
        if ($inStock < $quantity) {
            throw new InsufficientStock(sprintf(
                'Only %d of %s in stock, but this order needs %d. Update the stock count on the product first.',
                $inStock,
                $product->product_name,
                $quantity
            ));
        }

        $onShelf = $product->serial_numbers;
        $alreadyOnLine = SerialNumbers::clean($entry['serial_numbers'] ?? []);
        if ($alreadyOnLine !== []) {
            // Serial numbers typed onto the order earlier stay; those units leave the shelf
            $onShelf = array_values(array_udiff($onShelf, $alreadyOnLine, 'strcasecmp'));
            $leaving = $alreadyOnLine;
        } else {
            $leaving = array_splice($onShelf, 0, $quantity);
        }

        $product->serial_numbers = array_values($onShelf);
        $product->stock_quantity = $inStock - $quantity;
        $product->units_sold = $product->units_sold + $quantity;
        $product->save();

        return $leaving;
    }

    /**
     * @param  array<string, mixed>  $entry  an order line, or one product inside a bundle line
     */
    private static function returnToShelf(array $entry, int $quantity): void
    {
        $product = Product::whereKey($entry['id'] ?? null)->lockForUpdate()->first();
        if (! $product) {
            return;
        }

        $returning = SerialNumbers::clean($entry['serial_numbers'] ?? []);
        $onShelf = array_values(array_udiff($product->serial_numbers, $returning, 'strcasecmp'));

        // Returned units go back to the front, so they are the next to be sold
        $product->serial_numbers = array_merge($returning, $onShelf);
        $product->stock_quantity = (int) $product->stock_quantity + $quantity;
        $product->units_sold = $product->units_sold - $quantity;
        $product->save();
    }

    /**
     * The sale's lines. Older rows may hold them as a JSON string inside the JSON column.
     *
     * @return list<array<string, mixed>>
     */
    private static function lines(Sales $sale): array
    {
        $lines = $sale->order_details;
        if (is_string($lines)) {
            $lines = json_decode($lines, true);
        }

        return array_values(array_filter(is_array($lines) ? $lines : [], 'is_array'));
    }

    /**
     * A bundle: one line, several products.
     */
    private static function isBundleLine(array $line): bool
    {
        return ($line['type'] ?? '') === 'bundle' && is_array($line['components'] ?? null) && $line['components'] !== [];
    }

    /**
     * Lines that point at a product in the catalogue. Deals and items typed in by hand
     * at the counter have no stock to take from.
     */
    private static function isStockLine(array $line): bool
    {
        return ($line['type'] ?? 'product') === 'product'
            && isset($line['id'])
            && ctype_digit((string) $line['id']);
    }
}
