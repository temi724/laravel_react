{{-- The storefront page shell. Its title, description, canonical address, robots rule, share
     image and schema come from App\View\Components\Layout, which documents each of them. --}}
@php use App\Support\Seo; @endphp

<!DOCTYPE html>
<html lang="en-NG">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ $title }}</title>
        <meta name="description" content="{{ $description }}">
        <meta name="robots" content="{{ $robots }}">
        @if($indexable)
            <link rel="canonical" href="{{ $canonical }}">
        @endif
        <meta name="theme-color" content="#14171c">
        @if(config('store.seo.google_verification'))
            <meta name="google-site-verification" content="{{ config('store.seo.google_verification') }}">
        @endif
        @if(config('store.seo.bing_verification'))
            <meta name="msvalidate.01" content="{{ config('store.seo.bing_verification') }}">
        @endif

        {{-- Link previews on WhatsApp, Facebook, X and the like --}}
        <meta property="og:site_name" content="{{ config('store.name') }}">
        <meta property="og:locale" content="en_NG">
        <meta property="og:type" content="{{ $ogType }}">
        <meta property="og:title" content="{{ $title }}">
        <meta property="og:description" content="{{ $description }}">
        <meta property="og:url" content="{{ $canonical }}">
        @if($image)
            <meta property="og:image" content="{{ $image }}">
        @endif
        <meta name="twitter:card" content="{{ $image ? 'summary_large_image' : 'summary' }}">
        <meta name="twitter:title" content="{{ $title }}">
        <meta name="twitter:description" content="{{ $description }}">
        @if($image)
            <meta name="twitter:image" content="{{ $image }}">
        @endif
        {{ $head ?? '' }}

        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
        @if(is_file(public_path('images/murphylogo.png')))
            <link rel="apple-touch-icon" href="{{ asset('images/murphylogo.png') }}">
        @endif

        {{-- Analytics: deferred, so it never holds up the page. Listed before the app so its
             tracking functions exist by the time the components mount. --}}
        <script src="/js/analytics-tracker.js" defer></script>

        <!-- Styles (Manrope is bundled with the stylesheet) -->
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.js'])
        @livewireStyles

        @if(! empty($schema))
            <script type="application/ld+json">{!! Seo::graph($schema) !!}</script>
        @endif
    </head>

    <body class="bg-gray-50 font-sans antialiased">
        @include('partials.store-header')

        <!-- Main Content -->
        <main id="main">
            {{ $slot }}
        </main>

        @include('partials.store-footer')

        @livewireScripts

        @include('partials.store-scripts')
    </body>
</html>
