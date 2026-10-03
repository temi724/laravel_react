<?php

declare(strict_types=1);

namespace App\Helpers;

final class Money
{
    /**
     * Format an amount in naira. Whole amounts drop the kobo: ₦250,000 rather than ₦250,000.00.
     */
    public static function naira(float|int|string|null $amount): string
    {
        $value = (float) $amount;
        $hasKobo = (int) round($value * 100) % 100 !== 0;

        return '₦'.number_format($value, $hasKobo ? 2 : 0);
    }
}
