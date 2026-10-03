<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * Products that go together, sold for one price (an iPhone, an iPad and earbuds, for example).
 *
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property string $price
 * @property bool $is_active
 */
final class Bundle extends Model
{
    protected $fillable = ['name', 'description', 'price', 'is_active', 'created_by'];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        self::creating(function (self $bundle): void {
            if (empty($bundle->slug)) {
                $bundle->slug = self::uniqueSlug($bundle->name);
            }
        });
    }

    public static function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'bundle';
        $slug = $base;
        $suffix = 2;

        while (self::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    public function items(): HasMany
    {
        return $this->hasMany(BundleItem::class)->orderBy('position')->orderBy('id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
