<?php

namespace App\Helpers;

use Illuminate\Support\Str;

class SeoHelper
{
    /**
     * Generate meta description for a product
     */
    public static function generateMetaDescription($product): string
    {
        $description = '';

        if ($product->overview) {
            $description = strip_tags($product->overview);
        } elseif ($product->description) {
            $description = strip_tags($product->description);
        } else {
            $description = "Buy {$product->product_name} at " . config('app.name') . ". ";
            if ($product->category) {
                $description .= "Quality {$product->category->name} ";
            }
            $description .= "at affordable prices. " . ($product->in_stock ? "In stock" : "Limited availability") . ". Fast delivery nationwide.";
        }

        return Str::limit($description, 160);
    }

    /**
     * Generate meta keywords for a product
     */
    public static function generateMetaKeywords($product): string
    {
        $keywords = [$product->product_name];

        if ($product->category) {
            $keywords[] = $product->category->name;
        }

        $keywords = array_merge($keywords, [
            'gadgets',
            'electronics',
            'Nigeria',
            'Lagos',
            'online store',
            'buy online',
            config('app.name')
        ]);

        return implode(', ', array_unique($keywords));
    }

    /**
     * Get full image URL
     */
    public static function getFullImageUrl($imageUrl): string
    {
        if (Str::startsWith($imageUrl, ['http://', 'https://'])) {
            return $imageUrl;
        }

        return url($imageUrl);
    }

    /**
     * Generate product structured data
     */
    public static function generateProductStructuredData($product): array
    {
        $structuredData = [
            "@context" => "https://schema.org",
            "@type" => "Product",
            "name" => $product->product_name,
            "description" => self::generateMetaDescription($product),
            "brand" => [
                "@type" => "Brand",
                "name" => config('app.name')
            ],
            "offers" => [
                "@type" => "Offer",
                "price" => (string) $product->price,
                "priceCurrency" => "NGN",
                "availability" => $product->in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "url" => request()->url(),
                "seller" => [
                    "@type" => "Organization",
                    "name" => config('app.name')
                ]
            ],
            "url" => request()->url(),
            "sku" => (string) $product->id
        ];

        // Add images
        if ($product->images_url && count($product->images_url) > 0) {
            $structuredData["image"] = array_map(function($image) {
                return self::getFullImageUrl($image);
            }, $product->images_url);
        }

        // Add category
        if ($product->category) {
            $structuredData["category"] = $product->category->name;
        }

        // Add specifications
        if ($product->specification) {
            $specs = is_string($product->specification) ? json_decode($product->specification, true) : $product->specification;
            if ($specs) {
                $structuredData["additionalProperty"] = [];
                foreach ($specs as $key => $value) {
                    $structuredData["additionalProperty"][] = [
                        "@type" => "PropertyValue",
                        "name" => ucfirst(str_replace('_', ' ', $key)),
                        "value" => is_array($value) ? implode(', ', $value) : (string) $value
                    ];
                }
            }
        }

        return $structuredData;
    }

    /**
     * Generate breadcrumb structured data
     */
    public static function generateBreadcrumbStructuredData($product): array
    {
        $breadcrumbs = [
            "@context" => "https://schema.org",
            "@type" => "BreadcrumbList",
            "itemListElement" => [
                [
                    "@type" => "ListItem",
                    "position" => 1,
                    "name" => "Home",
                    "item" => url('/')
                ]
            ]
        ];

        $position = 2;

        // Add category if exists
        if ($product->category) {
            $breadcrumbs["itemListElement"][] = [
                "@type" => "ListItem",
                "position" => $position,
                "name" => $product->category->name,
                "item" => url('/search?category_id=' . $product->category->id)
            ];
            $position++;
        }

        // Add product
        $breadcrumbs["itemListElement"][] = [
            "@type" => "ListItem",
            "position" => $position,
            "name" => $product->product_name,
            "item" => request()->url()
        ];

        return $breadcrumbs;
    }
}
