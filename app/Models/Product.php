<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    protected $keyType = 'string';
    public $incrementing = false;
    // Fillable fields for mass assignment
    protected $fillable = [
        'id',
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
    ];

      protected $casts = [
        'reviews' => 'array',
        'images_url' => 'array',
        'colors' => 'array',
        'what_is_included' => 'array',
        'specification' => 'array',
        'storage_options' => 'array',
        'price' => 'decimal:2',
        'in_stock' => 'boolean',
    ];

    protected $appends = ['storage_options', 'display_price', 'default_storage'];

    // Generate MongoDB-like ObjectId
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = self::generateObjectId();
            }
        });
    }

      public static function generateObjectId()
    {
        return sprintf('%08x%08x%08x',
            time(),
            mt_rand(0, 0xffffff),
            mt_rand(0, 0xffffff)
        );
    }
    //     // Accessor to get storage options from specification
    // public function getStorageOptionsAttribute()
    // {
    //     return $this->specification['basefeature']['storage'] ?? [];
    // }

    // Get storage options with pricing
    public function getStorageOptionsAttribute()
    {
        // Only use explicitly set storage options
        if (isset($this->attributes['storage_options']) && $this->attributes['storage_options']) {
            $storedOptions = json_decode($this->attributes['storage_options'], true);
            if (is_array($storedOptions) && !empty($storedOptions)) {
                return $storedOptions;
            }
        }

        // Return empty array if no storage options are set
        return [];
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

    // Get default storage (first storage option)
    public function getDefaultStorageAttribute()
    {
        $storageOptions = $this->storage_options;
        if (!empty($storageOptions)) {
            return $storageOptions[0]['storage'];
        }
        return null;
    }

    // // Accessor to check if product has dual SIM
    // public function getHasDualSimAttribute()
    // {
    //     return $this->specification['basefeature']['dualsim'] ?? false;
    // }

    // // Scope to filter products in stock
    // public function scopeInStock($query)
    // {
    //     return $query->where('in_stock', true);
    // }

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

}
