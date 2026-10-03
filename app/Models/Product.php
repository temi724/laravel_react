<?php

namespace App\Models;

use App\Helpers\SerialNumbers;
use App\Models\Builders\ProductBuilder;
use App\Support\ProductUrls;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * @OA\Schema(
 *     schema="Product",
 *     type="object",
 *     title="Product",
 *     description="Product model",
 *     @OA\Property(property="id", type="string", example="68b74ba7002cda59000d800c"),
 *     @OA\Property(property="product_name", type="string", example="iPhone 15 Pro"),
 *     @OA\Property(property="category_id", type="string", nullable=true, example="68b74ba7002cda59000d800d"),
 *     @OA\Property(property="price", type="number", format="float", example=999.99),
 *     @OA\Property(property="overview", type="string", nullable=true, example="Latest iPhone with advanced features"),
 *     @OA\Property(property="description", type="string", nullable=true, example="Detailed product description"),
 *     @OA\Property(property="about", type="string", nullable=true, example="About this product"),
 *     @OA\Property(property="reviews", type="array", @OA\Items(type="object"), nullable=true),
 *     @OA\Property(property="images_url", type="array", @OA\Items(type="string"), nullable=true),
 *     @OA\Property(property="colors", type="array", @OA\Items(type="object"), nullable=true),
 *     @OA\Property(property="what_is_included", type="array", @OA\Items(type="string"), nullable=true),
 *     @OA\Property(property="specification", type="object", nullable=true),
 *     @OA\Property(property="in_stock", type="boolean", example=true),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 *
 * @OA\Schema(
 *     schema="ProductRequest",
 *     type="object",
 *     title="Product Request",
 *     description="Product creation/update request",
 *     required={"product_name", "price", "in_stock"},
 *     @OA\Property(property="product_name", type="string", example="iPhone 15 Pro"),
 *     @OA\Property(property="category_id", type="string", nullable=true, example="68b74ba7002cda59000d800d"),
 *     @OA\Property(property="price", type="number", format="float", example=999.99),
 *     @OA\Property(property="overview", type="string", nullable=true, example="Latest iPhone with advanced features"),
 *     @OA\Property(property="description", type="string", nullable=true, example="Detailed product description"),
 *     @OA\Property(property="about", type="string", nullable=true, example="About this product"),
 *     @OA\Property(property="reviews", type="array", @OA\Items(type="object"), nullable=true),
 *     @OA\Property(property="images_url", type="array", @OA\Items(type="string"), nullable=true),
 *     @OA\Property(
 *         property="colors",
 *         type="array",
 *         @OA\Items(
 *             type="object",
 *             @OA\Property(property="path", type="string", example="/images/blue.jpg"),
 *             @OA\Property(property="name", type="string", example="Blue")
 *         ),
 *         nullable=true
 *     ),
 *     @OA\Property(property="what_is_included", type="array", @OA\Items(type="string"), nullable=true),
 *     @OA\Property(property="specification", type="object", nullable=true),
 *     @OA\Property(property="in_stock", type="boolean", example=true)
 * )
 */


class Product extends Model
{
    use HasFactory;

    // The murphylog products table uses auto-increment ids. Keeping the key
    // type as string means ids are still serialized as strings for the frontend.
    protected $keyType = 'string';
    public $incrementing = true;

    // Fillable fields for mass assignment
    protected $fillable = [
        'product_name',
        'category_id',
        'reviews',
        'price',
        'overview',
        'description',
        'about',
        'images_url',
        'colors',
        'what_is_included',
        'specification',
        'storage_options',
        'in_stock',
        'product_status',
        'stock_quantity',
        'serial_numbers',
    ];

    protected $casts = [
        'category_id' => 'string',
        'price' => 'decimal:2',
        'stock_quantity' => 'integer',
    ];

    // Raw murphylog columns that are exposed under the names in $appends instead
    protected $hidden = [
        'name',
        'cost_price',
        'short_description',
        'images',
        'attributes',
        'meta_data',
    ];

    protected $appends = [
        'product_name',
        'overview',
        'about',
        'reviews',
        'images_url',
        'colors',
        'what_is_included',
        'specification',
        'storage_options',
        'in_stock',
        'product_status',
        'display_price',
        'default_storage',
        'url',
    ];

    protected static function boot()
    {
        parent::boot();

        // slug, sku and description are required by the murphylog schema
        static::creating(function ($model) {
            if (empty($model->slug)) {
                $model->slug = self::generateUniqueSlug($model->product_name);
            }
            if (empty($model->sku)) {
                $model->sku = self::generateSku();
            }
            if (is_null($model->description)) {
                $model->description = '';
            }
        });

        // The store keeps product pages for up to 30 minutes. Drop them when a product changes,
        // so a new price or stock count shows straight away.
        $forget = function ($model) {
            cache()->forget("product.{$model->id}");
            cache()->forget("product.show.{$model->id}");
        };
        static::saved($forget);
        static::deleted($forget);

        // The page address follows the name; the address it had before becomes a redirect
        static::saved(function ($model) {
            if ($model->wasRecentlyCreated || $model->wasChanged('name')) {
                ProductUrls::shared()->sync($model);
            }
        });
        static::deleted(fn ($model) => ProductUrls::shared()->release($model));
    }

    public static function generateUniqueSlug($name)
    {
        do {
            $slug = Str::slug($name) . '-' . mt_rand(1000, 9999);
        } while (self::where('slug', $slug)->exists());

        return $slug;
    }

    public static function generateSku()
    {
        do {
            $sku = 'SKU-' . Str::lower(Str::random(2)) . mt_rand(1000, 9999);
        } while (self::where('sku', $sku)->exists());

        return $sku;
    }

    public function newEloquentBuilder($query)
    {
        return new ProductBuilder($query);
    }

    // Fields that have no column in murphylog are kept in the meta_data JSON column
    protected function getMeta($key, $default = null)
    {
        $meta = json_decode($this->attributes['meta_data'] ?? '', true);

        return is_array($meta) && array_key_exists($key, $meta) ? $meta[$key] : $default;
    }

    protected function setMeta($key, $value)
    {
        $meta = json_decode($this->attributes['meta_data'] ?? '', true);
        $meta = is_array($meta) ? $meta : [];
        $meta[$key] = $value;

        $this->attributes['meta_data'] = json_encode($meta);
    }

    // product_name <-> name
    public function getProductNameAttribute()
    {
        return $this->attributes['name'] ?? null;
    }

    public function setProductNameAttribute($value)
    {
        $this->attributes['name'] = $value;
    }

    // overview <-> short_description
    public function getOverviewAttribute()
    {
        return $this->attributes['short_description'] ?? null;
    }

    public function setOverviewAttribute($value)
    {
        $this->attributes['short_description'] = $value;
    }

    // description is NOT NULL in murphylog
    public function setDescriptionAttribute($value)
    {
        $this->attributes['description'] = $value ?? '';
    }

    // images_url <-> images
    public function getImagesUrlAttribute()
    {
        $images = json_decode($this->attributes['images'] ?? '', true);

        return is_array($images) ? array_values($images) : [];
    }

    public function setImagesUrlAttribute($value)
    {
        $this->attributes['images'] = json_encode(array_values((array) $value));
    }

    // A product can be bought when it is listed ('active') and there is at least one unit left
    public function getInStockAttribute()
    {
        return ($this->attributes['status'] ?? 'active') === 'active'
            && (int) ($this->attributes['stock_quantity'] ?? 0) > 0;
    }

    public function setInStockAttribute($value)
    {
        if (filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
            $this->attributes['status'] = 'active';
        } elseif (($this->attributes['status'] ?? 'active') === 'active') {
            // Leave an 'inactive' product as it is
            $this->attributes['status'] = 'out_of_stock';
        }
    }

    // The stock count drives the status: the last unit sold makes the product out of stock,
    // new units put it back on sale. A hidden ('inactive') product stays hidden.
    public function setStockQuantityAttribute($value)
    {
        $quantity = max(0, (int) $value);
        $this->attributes['stock_quantity'] = $quantity;

        $status = $this->attributes['status'] ?? 'active';
        if ($quantity === 0 && $status === 'active') {
            $this->attributes['status'] = 'out_of_stock';
        } elseif ($quantity > 0 && $status === 'out_of_stock') {
            $this->attributes['status'] = 'active';
        }
    }

    // Serial numbers (or IMEIs) of the units still in stock, in the order they will be sold.
    // Admin only: this is not part of the public product data.
    public function getSerialNumbersAttribute()
    {
        return SerialNumbers::clean($this->getMeta('serial_numbers', []));
    }

    public function setSerialNumbersAttribute($value)
    {
        $this->setMeta('serial_numbers', SerialNumbers::clean($value));
    }

    // How many units have been sold so far (kept up to date by App\Services\Inventory). Admin only.
    public function getUnitsSoldAttribute()
    {
        return max(0, (int) $this->getMeta('units_sold', 0));
    }

    public function setUnitsSoldAttribute($value)
    {
        $this->setMeta('units_sold', max(0, (int) $value));
    }

    // The admin who listed the product: ['id' => ..., 'name' => ..., 'email' => ...]. Admin only.
    // Not mass assignable: it is set from the signed-in admin, never from the request.
    public function getListedByAttribute()
    {
        $admin = $this->getMeta('listed_by');

        return is_array($admin) && ! empty($admin['name']) ? $admin : null;
    }

    public function setListedByAttribute($value)
    {
        $this->setMeta('listed_by', is_array($value) ? [
            'id' => isset($value['id']) ? (string) $value['id'] : null,
            'name' => (string) ($value['name'] ?? ''),
            'email' => (string) ($value['email'] ?? ''),
        ] : null);
    }

    /**
     * Record the admin who is listing this product.
     */
    public function listedBy(?Admin $admin): static
    {
        if ($admin) {
            $this->listed_by = ['id' => $admin->id, 'name' => $admin->name, 'email' => $admin->email];
        }

        return $this;
    }

    // What the admin screens see on top of the public product data
    public const ADMIN_FIELDS = ['serial_numbers', 'units_sold', 'listed_by'];

    public function getAboutAttribute()
    {
        return $this->getMeta('about');
    }

    public function setAboutAttribute($value)
    {
        $this->setMeta('about', $value);
    }

    public function getReviewsAttribute()
    {
        return $this->getMeta('reviews');
    }

    public function setReviewsAttribute($value)
    {
        $this->setMeta('reviews', $value);
    }

    public function getColorsAttribute()
    {
        return $this->getMeta('colors');
    }

    public function setColorsAttribute($value)
    {
        $this->setMeta('colors', $value);
    }

    public function getWhatIsIncludedAttribute()
    {
        return $this->getMeta('what_is_included');
    }

    public function setWhatIsIncludedAttribute($value)
    {
        $this->setMeta('what_is_included', $value);
    }

    public function getProductStatusAttribute()
    {
        return $this->getMeta('product_status', 'new');
    }

    public function setProductStatusAttribute($value)
    {
        $this->setMeta('product_status', $value ?: 'new');
    }

    // Products that were never edited here fall back to the murphylog brand/attributes columns
    public function getSpecificationAttribute()
    {
        $specification = $this->getMeta('specification');
        if (is_array($specification)) {
            return $specification;
        }

        $legacy = json_decode($this->attributes['attributes'] ?? '', true);
        $legacy = is_array($legacy) ? $legacy : [];
        if (!empty($this->attributes['brand'])) {
            $legacy = ['brand' => $this->attributes['brand']] + $legacy;
        }

        return $legacy ?: null;
    }

    public function setSpecificationAttribute($value)
    {
        $this->setMeta('specification', $value);
    }

    // Get storage options with pricing
    public function getStorageOptionsAttribute()
    {
        // Only use explicitly set storage options
        $storedOptions = $this->getMeta('storage_options');
        if (is_array($storedOptions) && !empty($storedOptions)) {
            return $storedOptions;
        }

        // Return empty array if no storage options are set
        return [];
    }

    public function setStorageOptionsAttribute($value)
    {
        $this->setMeta('storage_options', $value);
    }

    // Get display price (first storage option price if storage exists, otherwise base price)
    public function getDisplayPriceAttribute()
    {
        $storageOptions = $this->storage_options;
        if (!empty($storageOptions)) {
            return $storageOptions[0]['price'];
        }
        return $this->price;
    }

    /**
     * The usual price of one unit: the base price, or the price of a storage size.
     * Null when the product is not sold in that size.
     */
    public function priceFor(?string $storage): ?float
    {
        if ($storage === null || trim($storage) === '') {
            return (float) $this->price;
        }

        foreach ($this->storage_options as $option) {
            if (is_array($option) && strcasecmp(trim((string) ($option['storage'] ?? '')), trim($storage)) === 0) {
                return (float) ($option['price'] ?? 0) ?: (float) $this->price;
            }
        }

        return null;
    }

    // The product's page on the storefront, with the slug the route expects
    public function getUrlAttribute(): string
    {
        return \App\Support\Seo::productPath($this);
    }

    // Get default storage (first storage option)
    public function getDefaultStorageAttribute()
    {
        $storageOptions = $this->storage_options;
        if (!empty($storageOptions)) {
            return $storageOptions[0]['storage'];
        }
        return null;
    }

    // Relationship with category
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Scope to filter products by category
    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    // Scope to filter products by availability
    public function scopeInStock($query, $inStock = true)
    {
        return $inStock
            ? $query->where('status', 'active')->where('stock_quantity', '>', 0)
            : $query->where(fn ($q) => $q->where('status', '!=', 'active')->orWhere('stock_quantity', '<=', 0));
    }

    // Products with no photo yet, for example ones just imported from a spreadsheet
    public function scopeWithoutPhotos($query)
    {
        return $query->where(fn ($q) => $q->whereNull('images')->orWhereIn('images', ['', '[]', 'null']));
    }

    // Scope to filter products by condition (new, uk_used, refurbished)
    public function scopeProductStatus($query, $status)
    {
        return $query->where(function ($q) use ($status) {
            $q->where('meta_data->product_status', $status);
            if ($status === 'new') {
                $q->orWhereNull('meta_data->product_status');
            }
        });
    }

    // Scope to search name, description, overview and about
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'LIKE', "%{$term}%")
              ->orWhere('description', 'LIKE', "%{$term}%")
              ->orWhere('short_description', 'LIKE', "%{$term}%")
              ->orWhere('meta_data->about', 'LIKE', "%{$term}%");
        });
    }

}
