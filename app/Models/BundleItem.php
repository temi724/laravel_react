<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One product inside a bundle, with how many of it and (for products sold in sizes) which size.
 *
 * @property int $bundle_id
 * @property int $product_id
 * @property string|null $storage
 * @property int $quantity
 */
final class BundleItem extends Model
{
    protected $fillable = ['bundle_id', 'product_id', 'storage', 'quantity', 'position'];

    protected $casts = [
        'quantity' => 'integer',
        'position' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function bundle(): BelongsTo
    {
        return $this->belongsTo(Bundle::class);
    }
}
