<?php

namespace App\Models\Builders;

use Illuminate\Database\Eloquent\Builder;

class ProductBuilder extends Builder
{
    /**
     * Products have numeric ids while deals have ObjectId-style string ids, and the
     * app looks an id up as a product first and falls back to a deal. MySQL would
     * coerce a deal id such as "68b74ba7..." to 68 and return an unrelated product,
     * so a non-numeric key must never match.
     */
    public function whereKey($id)
    {
        if (is_scalar($id) && !ctype_digit((string) $id)) {
            return $this->whereRaw('0 = 1');
        }

        return parent::whereKey($id);
    }
}
