<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One address a product or flash deal has, or used to have. See App\Support\ProductUrls.
 */
final class ProductSlug extends Model
{
    protected $fillable = ['slug', 'item_type', 'item_id', 'is_current'];

    protected $casts = ['is_current' => 'boolean'];
}
