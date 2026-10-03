<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PromotionType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A special price on one product for a set time: the deal of the day, or a drop.
 *
 * @property int $id
 * @property PromotionType $type
 * @property int $product_id
 * @property string|null $storage
 * @property string $price
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property int|null $quantity_limit
 * @property int|null $per_order_limit
 * @property int $units_sold
 * @property string|null $headline
 * @property bool $is_active
 */
final class Promotion extends Model
{
    protected $fillable = [
        'type', 'product_id', 'storage', 'price', 'starts_at', 'ends_at',
        'quantity_limit', 'per_order_limit', 'headline', 'is_active', 'created_by',
    ];

    protected $casts = [
        'type' => PromotionType::class,
        'price' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'quantity_limit' => 'integer',
        'per_order_limit' => 'integer',
        'units_sold' => 'integer',
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Units still available at this price, or null when there is no limit.
     */
    public function remaining(): ?int
    {
        return $this->quantity_limit === null ? null : max(0, $this->quantity_limit - $this->units_sold);
    }

    /**
     * Where the promotion stands right now: off, scheduled, live, sold_out or ended.
     */
    public function status(?Carbon $now = null): string
    {
        $now ??= now();

        return match (true) {
            ! $this->is_active => 'off',
            $this->ends_at !== null && $this->ends_at->lte($now) => 'ended',
            $this->starts_at !== null && $this->starts_at->gt($now) => 'scheduled',
            $this->remaining() === 0 => 'sold_out',
            default => 'live',
        };
    }

    public function isLive(?Carbon $now = null): bool
    {
        return $this->status($now) === 'live';
    }

    // Switched on and not yet over: it is running, or it is still to come
    public function scopeCurrent(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now()));
    }

    public function scopeStarted(Builder $query): Builder
    {
        return $query->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()));
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('starts_at', '>', now());
    }
}
