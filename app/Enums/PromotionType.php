<?php

declare(strict_types=1);

namespace App\Enums;

enum PromotionType: string
{
    /** One product at a special price for a day */
    case DealOfDay = 'deal_of_day';

    /** A limited number of units released at a set moment, at a special price */
    case Drop = 'drop';

    public function label(): string
    {
        return match ($this) {
            self::DealOfDay => 'Deal of the day',
            self::Drop => 'Drop',
        };
    }
}
