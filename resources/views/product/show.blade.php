<x-layout>@php@php<x-layout>

    <x-slot name="title">Product Details - {{ config('app.name') }}</x-slot>

    $ogImage = ($product->images_url && count($product->images_url) > 0) ? $product->images_url[0] : '';

    @include('react.product-show', [

        'product' => $product,    $description = $product->overview ?? $product->description ?? 'Check out this amazing product!';    $ogImage = ($product->images_url && count($product->images_url) > 0) ? $product->images_url[0] : '';    <x-slot name="title">{{ $product->product_name }} - {{ config('app.name') }}</x-slot>

        'type' => $type

    ])

</x-layout>
    $structuredData = [    $description = $product->overview ?? $product->description ?? 'Check out this amazing product!';

        '@context' => 'https://schema.org/',

        '@type' => 'Product',        <!-- SEO Meta Tags -->

        'name' => $product->product_name,

        'description' => $product->description ?? $product->overview ?? '',    $structuredData = [    <x-slot name="head">

        'brand' => [

            '@type' => 'Brand',        '@context' => 'https://schema.org/',        <!-- Open Graph tags for social media sharing -->

            'name' => explode(' ', $product->product_name)[0] ?? 'Generic'

        ],        '@type' => 'Product',        <meta property="og:title" content="{{ $product->product_name }}">

        'offers' => [

            '@type' => 'Offer',        'name' => $product->product_name,        <meta property="og:description" content="{{ $product->overview ?? $product->description ?? 'Check out this amazing product!' }}">

            'price' => $product->display_price,

            'priceCurrency' => 'NGN',        'description' => $product->description ?? $product->overview ?? '',        @if($product->images_url && count($product->images_url) > 0)

            'availability' => $product->in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',

            'url' => request()->url()        'brand' => [            <meta property="og:image" content="{{ $product->images_url[0] }}">

        ]

    ];            '@type' => 'Brand',        @endif



    if ($product->images_url && count($product->images_url) > 0) {            'name' => explode(' ', $product->product_name)[0] ?? 'Generic'        <meta property="og:url" content="{{ request()->url() }}">

        $structuredData['image'] = $product->images_url;

    }        ],        <meta property="og:type" content="product">



    if (isset($product->category)) {        'offers' => [

        $structuredData['category'] = $product->category->name;

    }            '@type' => 'Offer',        <!-- Twitter Card tags -->

@endphp

            'price' => $product->display_price,        <meta name="twitter:card" content="summary_large_image">

<x-layout>

    <x-slot name="title">{{ $product->product_name }} - {{ config('app.name') }}</x-slot>            'priceCurrency' => 'NGN',        <meta name="twitter:title" content="{{ $product->product_name }}">



    <x-slot name="head">            'availability' => $product->in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',        <meta name="twitter:description" content="{{ $product->overview ?? $product->description ?? 'Check out this amazing product!' }}">

        <!-- Open Graph tags -->

        <meta property="og:title" content="{{ $product->product_name }}">            'url' => request()->url()        @if($product->images_url && count($product->images_url) > 0)

        <meta property="og:description" content="{{ $description }}">

        @if($ogImage)        ]            <meta name="twitter:image" content="{{ $product->images_url[0] }}">

            <meta property="og:image" content="{{ $ogImage }}">

        @endif    ];        @endif

        <meta property="og:url" content="{{ request()->url() }}">

        <meta property="og:type" content="product">



        <!-- Twitter Card tags -->    if ($product->images_url && count($product->images_url) > 0) {        <!-- Product structured data for search engines -->

        <meta name="twitter:card" content="summary_large_image">

        <meta name="twitter:title" content="{{ $product->product_name }}">        $structuredData['image'] = $product->images_url;        <script type="application/ld+json">

        <meta name="twitter:description" content="{{ $description }}">

        @if($ogImage)    }        {

            <meta name="twitter:image" content="{{ $ogImage }}">

        @endif                "@context": "https://schema.org/",



        <!-- Structured data -->    if (isset($product->category)) {            "@type": "Product",

        <script type="application/ld+json">

        {!! json_encode($structuredData, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) !!}        $structuredData['category'] = $product->category->name;            "name": {{ json_encode($product->product_name) }},

        </script>

    </x-slot>    }            "description": {{ json_encode($product->description ?? $product->overview ?? '') }},



    @include('react.product-show', [@endphp            @if($product->images_url && count($product->images_url) > 0)

        'product' => $product,

        'type' => $type            "image": {{ json_encode($product->images_url) }},

    ])

</x-layout><x-layout>            @endif

    <x-slot name="title">{{ $product->product_name }} - {{ config('app.name') }}</x-slot>            "brand": {

                "@type": "Brand",

    <!-- SEO Meta Tags -->                "name": {{ json_encode(explode(' ', $product->product_name)[0] ?? 'Generic') }}

    <x-slot name="head">            },

        <!-- Open Graph tags for social media sharing -->            "offers": {

        <meta property="og:title" content="{{ $product->product_name }}">                "@type": "Offer",

        <meta property="og:description" content="{{ $description }}">                "price": {{ json_encode($product->display_price) }},

        @if($ogImage)                "priceCurrency": "NGN",

            <meta property="og:image" content="{{ $ogImage }}">                "availability": {{ json_encode($product->in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock') }},

        @endif                "url": {{ json_encode(request()->url()) }}

        <meta property="og:url" content="{{ request()->url() }}">            }{{ isset($product->category) ? ',' : '' }}

        <meta property="og:type" content="product">            @if(isset($product->category))

            "category": {{ json_encode($product->category->name) }}

        <!-- Twitter Card tags -->            @endif

        <meta name="twitter:card" content="summary_large_image">        }

        <meta name="twitter:title" content="{{ $product->product_name }}">        </script>

        <meta name="twitter:description" content="{{ $description }}">    </x-slot>

        @if($ogImage)

            <meta name="twitter:image" content="{{ $ogImage }}">    <!-- React ProductShow Component -->

        @endif    @include('react.product-show', [

        'product' => $product,

        <!-- Product structured data for search engines -->        'type' => $type

        <script type="application/ld+json">    ])

        {!! json_encode($structuredData, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) !!}</x-layout>

        </script>
    </x-slot>

    <!-- React ProductShow Component -->
    @include('react.product-show', [
        'product' => $product,
        'type' => $type
    ])
</x-layout>
