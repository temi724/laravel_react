<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory;

    // The murphylog categories table uses auto-increment ids. Keeping the key
    // type as string means ids are still serialized as strings for the frontend.
    public $incrementing = true;

    protected $keyType = 'string';

    protected $fillable = [
        'name',
    ];

    protected static function boot()
    {
        parent::boot();

        // slug is required and unique in the murphylog schema
        static::creating(function ($model) {
            if (empty($model->slug)) {
                $model->slug = self::generateUniqueSlug($model->name);
            }
        });
    }

    public static function generateUniqueSlug($name)
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 2;

        while (self::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $suffix++;
        }

        return $slug;
    }

    // Relationship with products
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
