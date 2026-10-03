<?php echo '<?xml version="1.0" encoding="UTF-8"?>'; ?>

{{-- Every page worth finding in search: the home page, the listings, the shop page, each
     category with products in it, each bundle and each product with its first photo.
     Cart, checkout and search results are left out on purpose. (StorePageController@sitemap) --}}
@php use App\Support\Seo; @endphp
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url>
        <loc>{{ Seo::url('/') }}</loc>
        @if($latest)<lastmod>{{ $latest->toDateString() }}</lastmod>@endif
    </url>
    <url>
        <loc>{{ Seo::url('/products') }}</loc>
        @if($latest)<lastmod>{{ $latest->toDateString() }}</lastmod>@endif
    </url>
    <url>
        <loc>{{ Seo::url('/about') }}</loc>
    </url>
    @foreach($categories as $category)
    <url>
        <loc>{{ Seo::url(Seo::categoryPath($category)) }}</loc>
    </url>
    @endforeach
    @foreach($bundles as $bundle)
    <url>
        <loc>{{ Seo::url('/bundle/'.$bundle->slug) }}</loc>
        @if($bundle->updated_at)<lastmod>{{ $bundle->updated_at->toDateString() }}</lastmod>@endif
    </url>
    @endforeach
    @foreach($products as $product)
    <url>
        <loc>{{ Seo::url(Seo::productPath($product)) }}</loc>
        @if($product->updated_at)<lastmod>{{ $product->updated_at->toDateString() }}</lastmod>@endif
        @if($image = Seo::image($product->images_url[0] ?? null))
        <image:image>
            <image:loc>{{ $image }}</image:loc>
        </image:image>
        @endif
    </url>
    @endforeach
</urlset>
