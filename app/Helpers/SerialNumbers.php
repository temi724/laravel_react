<?php

declare(strict_types=1);

namespace App\Helpers;

/**
 * Serial numbers (or IMEIs) of units.
 *
 * A product lists the serial numbers of the units still in stock. When an order is confirmed
 * they move onto the sale: each line of its order_details gets "serial_numbers", a list with
 * at most one entry per unit of that line (see App\Services\Inventory).
 */
final class SerialNumbers
{
    public const MAX_LENGTH = 64;

    /**
     * The serial numbers as entered, trimmed and without the blanks.
     *
     * @return list<string>
     */
    public static function clean(mixed $serials): array
    {
        if (! is_array($serials)) {
            return [];
        }

        $cleaned = [];
        foreach ($serials as $serial) {
            if (! is_string($serial) && ! is_int($serial)) {
                continue;
            }

            // Spaces inside a serial number are kept as one space; a scanner may add stray ones around it
            $serial = trim((string) preg_replace('/\s+/', ' ', (string) $serial));
            if ($serial !== '') {
                $cleaned[] = $serial;
            }
        }

        return $cleaned;
    }

    /**
     * What is wrong with the serial numbers listed on a product, given its stock count.
     * Empty when everything is fine.
     *
     * @param  list<string>  $serials  already cleaned
     * @return list<string>
     */
    public static function productProblems(array $serials, int $stock): array
    {
        $messages = [];

        if (count($serials) > $stock) {
            $messages[] = sprintf(
                'You listed %d serial numbers but the stock count is %d. Raise the count or remove a serial number.',
                count($serials),
                $stock
            );
        }

        $seen = [];
        foreach ($serials as $serial) {
            if (mb_strlen($serial) > self::MAX_LENGTH) {
                $messages[] = sprintf('Serial number %s is longer than %d characters.', mb_substr($serial, 0, 20).'...', self::MAX_LENGTH);
            }

            $key = mb_strtolower($serial);
            if (isset($seen[$key])) {
                $messages[] = sprintf('Serial number %s is listed more than once.', $serial);
            }
            $seen[$key] = true;
        }

        return array_values(array_unique($messages));
    }
}
