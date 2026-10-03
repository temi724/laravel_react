<?php

declare(strict_types=1);

namespace App\Helpers;

/**
 * How one line of a sale reads on an invoice or receipt: its options, what a bundle
 * contains, and the serial numbers of the units sold.
 */
final class SaleLine
{
    /**
     * The small print under the item name.
     *
     * @param  array<string, mixed>  $line
     */
    public static function note(array $line): string
    {
        $parts = array_filter([
            $line['selected_storage'] ?? null,
            $line['selected_color'] ?? null,
            $line['description'] ?? null,
        ]);

        if (($line['type'] ?? '') === 'bundle' && is_array($line['components'] ?? null)) {
            $parts[] = 'Bundle of '.implode(', ', array_map(
                fn (array $part) => (((int) ($part['quantity'] ?? 1)) > 1 ? $part['quantity'].' x ' : '')
                    .($part['name'] ?? 'Product')
                    .(! empty($part['storage']) ? ' ('.$part['storage'].')' : ''),
                array_filter($line['components'], 'is_array')
            ));
        }

        if (! empty($line['promotion_label'])) {
            $parts[] = $line['promotion_label'].' price';
        }

        return implode(', ', $parts);
    }

    /**
     * The serial numbers on the line, as one sentence. For a bundle each product's are named.
     *
     * @param  array<string, mixed>  $line
     */
    public static function serials(array $line): string
    {
        if (($line['type'] ?? '') === 'bundle' && is_array($line['components'] ?? null)) {
            $parts = [];
            foreach (array_filter($line['components'], 'is_array') as $part) {
                $serials = SerialNumbers::clean($part['serial_numbers'] ?? []);
                if ($serials !== []) {
                    $parts[] = ($part['name'] ?? 'Product').': '.implode(', ', $serials);
                }
            }

            return implode('; ', $parts);
        }

        return implode(', ', SerialNumbers::clean($line['serial_numbers'] ?? []));
    }
}
