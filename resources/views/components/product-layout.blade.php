<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Dynamic SEO Meta Tags --}}
        <title>{{ $title ?? ($product->product_name . ' - ' . config('app.name')) }}</title>

        {{-- Meta Description --}}
        <meta name="description" content="{{ $metaDescription ?? \App\Helpers\SeoHelper::generateMetaDescription($product) }}">

        {{-- Meta Keywords --}}
        <meta name="keywords" content="{{ $metaKeywords ?? \App\Helpers\SeoHelper::generateMetaKeywords($product) }}">

        {{-- Canonical URL --}}
        <link rel="canonical" href="{{ $canonicalUrl ?? request()->url() }}">

        {{-- Open Graph Meta Tags --}}
        <meta property="og:type" content="product">
        <meta property="og:title" content="{{ $ogTitle ?? ($product->product_name . ' - ' . config('app.name')) }}">
        <meta property="og:description" content="{{ $ogDescription ?? \App\Helpers\SeoHelper::generateMetaDescription($product) }}">
        <meta property="og:url" content="{{ request()->url() }}">
        <meta property="og:site_name" content="{{ config('app.name') }}">

        {{-- Product Images for Open Graph --}}
        @if($product->images_url && count($product->images_url) > 0)
            @foreach(array_slice($product->images_url, 0, 4) as $image)
                <meta property="og:image" content="{{ \App\Helpers\SeoHelper::getFullImageUrl($image) }}">
            @endforeach
            <meta property="og:image:width" content="800">
            <meta property="og:image:height" content="600">
            <meta property="og:image:alt" content="{{ $product->product_name }}">
        @endif

        {{-- Twitter Card Meta Tags --}}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $product->product_name }}">
        <meta name="twitter:description" content="{{ \App\Helpers\SeoHelper::generateMetaDescription($product) }}">
        @if($product->images_url && count($product->images_url) > 0)
            <meta name="twitter:image" content="{{ \App\Helpers\SeoHelper::getFullImageUrl($product->images_url[0]) }}">
            <meta name="twitter:image:alt" content="{{ $product->product_name }}">
        @endif

        {{-- Product-specific meta tags --}}
        <meta property="product:price:amount" content="{{ $product->price }}">
        <meta property="product:price:currency" content="NGN">
        <meta property="product:availability" content="{{ $product->in_stock ? 'in stock' : 'out of stock' }}">
        @if($product->category)
            <meta property="product:category" content="{{ $product->category->name }}">
        @endif

        {{-- Robots meta --}}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

        {{-- Fonts --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet">

        {{-- Styles --}}
        @vite(['resources/css/app.css', 'resources/js/app.js'])
        @livewireStyles

        {{-- Analytics Tracking Script --}}
        <script src="/js/analytics-tracker.js"></script>

        {{-- JSON-LD Structured Data --}}
        <script type="application/ld+json">
        {!! json_encode(\App\Helpers\SeoHelper::generateProductStructuredData($product), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
        </script>

        {{-- Breadcrumb Structured Data --}}
        <script type="application/ld+json">
        {!! json_encode(\App\Helpers\SeoHelper::generateBreadcrumbStructuredData($product), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
        </script>
    </head>
    <body class="bg-gray-50 font-sans antialiased">
        {{-- Header --}}
        <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            {{-- Top Bar --}}
            <div class="bg-blue-900 text-white text-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center py-2">
                        <div class="flex items-center space-x-6">
                            <span>+2348024913553</span>
                        </div>
                        <div class="flex items-center space-x-4">
                            {{-- <a href="#" class="hover:text-blue-200 transition">Track Order</a>
                            <a href="#" class="hover:text-blue-200 transition">Help</a> --}}
                        </div>
                    </div>
                </div>
            </div>

            {{-- Main Header --}}
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {{-- Mobile Header Layout --}}
                <div class="block md:hidden">
                    {{-- Top row: Logo and icons --}}
                    <div class="flex items-center justify-between h-16">
                        {{-- Logo --}}
                        <div class="flex-shrink-0">
                            <a href="/" class="flex items-center">
                                <img src="{{ asset('images/murphylogo.png') }}" alt="Murphylog Global" class="h-10 w-auto">
                                <span class="ml-3 text-xl font-bold text-gray-900">Murphylog global</span>
                            </a>
                        </div>

                        {{-- Right Section --}}
                        <div class="flex items-center space-x-4">
                            {{-- Cart --}}
                            <a href="{{ route('cart.index') }}" @click.prevent="$dispatch('open-cart')" class="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition">
                                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.5 7.67001V6.70001C7.5 4.45001 9.31 2.24001 11.56 2.03001C14.24 1.77001 16.5 3.88001 16.5 6.51001V7.89001" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M9.00006 22H15.0001C19.0201 22 19.7401 20.39 19.9501 18.43L20.7001 12.43C20.9701 9.99 20.2701 8 16.0001 8H8.00006C3.73006 8 3.03006 9.99 3.30006 12.43L4.05006 18.43C4.26006 20.39 4.98006 22 9.00006 22Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M15.4955 12H15.5045" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8.49451 12H8.50349" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <div data-react-component="CartCounter"></div>
                            </a>

                            {{-- User Menu --}}
                            <div class="relative" x-data="{ open: false }">
                                <button @click="open = !open" class="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition">
                                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {{-- Search Bar Row for Mobile --}}
                    <div class="pb-4">
                        @include('react.search-bar')
                    </div>
                </div>

                {{-- Desktop Header Layout --}}
                <div class="hidden md:flex items-center justify-between h-16">
                    {{-- Logo --}}
                    <div class="flex-shrink-0">
                        <a href="/" class="flex items-center">
                            <img src="{{ asset('images/murphylogo.png') }}" alt="Murphylog Global" class="h-20 w-auto">
                            <span class="ml-3 text-xl font-bold text-gray-900">Murphylog global</span>
                        </a>
                    </div>

                    {{-- Search Bar --}}
                    <div class="flex-1 max-w-2xl mx-8">
                        @include('react.search-bar')
                    </div>

                    {{-- Right Section --}}
                    <div class="flex items-center space-x-6">
                        {{-- Cart --}}
                        <a href="{{ route('cart.index') }}" @click.prevent="$dispatch('open-cart')" class="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition">
                            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.5 7.67001V6.70001C7.5 4.45001 9.31 2.24001 11.56 2.03001C14.24 1.77001 16.5 3.88001 16.5 6.51001V7.89001" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M9.00006 22H15.0001C19.0201 22 19.7401 20.39 19.9501 18.43L20.7001 12.43C20.9701 9.99 20.2701 8 16.0001 8H8.00006C3.73006 8 3.03006 9.99 3.30006 12.43L4.05006 18.43C4.26006 20.39 4.98006 22 9.00006 22Z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M15.4955 12H15.5045" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M8.49451 12H8.50349" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span class="hidden sm:block">Cart</span>
                            <div data-react-component="CartCounter"></div>
                        </a>
                    </div>
                </div>

                {{-- Navigation --}}
                <nav class="border-t border-gray-200">
                    <div class="flex items-center justify-between py-3">
                        <div class="flex items-center space-x-8">
                            {{-- Categories Dropdown --}}
                            <div class="relative" x-data="{ open: false }">
                                <button @click="open = !open" class="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition">
                                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 7H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                        <path d="M3 12H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                        <path d="M3 17H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                    </svg>
                                    <span>Categories</span>
                                    <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': open }" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M19.9201 8.95001L13.4001 15.47C12.6301 16.24 11.3701 16.24 10.6001 15.47L4.08008 8.95001" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>

                                {{-- Categories Dropdown Menu --}}
                                <div x-show="open" @click.away="open = false" x-transition class="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-200">
                                    @php
                                        $categories = \App\Models\Category::all();
                                    @endphp

                                    <a href="/" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">
                                        <span class="font-medium">All Products</span>
                                    </a>
                                    <div class="border-t border-gray-100 my-1"></div>

                                    @foreach($categories as $category)
                                        <a href="#"
                                           onclick="filterByCategory('{{ $category->id }}')"
                                           class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">
                                            {{ $category->name }}
                                        </a>
                                    @endforeach
                                </div>
                            </div>

                            {{-- Quick Category Links - Hidden on mobile --}}
                            <div class="hidden sm:flex space-x-4">
                                {{-- <a href="#" onclick="filterByCategory('')" class="text-gray-700 hover:text-blue-600 transition">All</a>
                                <a href="#" onclick="filterByCategoryName('Smartphones')" class="text-gray-700 hover:text-blue-600 transition">Smartphones</a>
                                <a href="#" onclick="filterByCategoryName('Laptops')" class="text-gray-700 hover:text-blue-600 transition">Laptops</a>
                                <a href="#" onclick="filterByCategoryName('Gaming Consoles')" class="text-gray-700 hover:text-blue-600 transition">Gaming</a>
                                <a href="#" onclick="filterByCategoryName('Speakers')" class="text-gray-700 hover:text-blue-600 transition">Audio</a>
                                <a href="#" onclick="filterByCategoryName('Smart Home')" class="text-gray-700 hover:text-blue-600 transition">Smart Home</a> --}}
                                <a href="#deals" class="text-red-600 font-medium">Deals</a>
                            </div>
                        </div>

                        {{-- Delivery Information - Hidden on mobile --}}
                        <div class="text-sm text-gray-600 hidden sm:block">
                            📍 We deliver to: <span class="font-medium">All States in Nigeria</span>
                        </div>
                    </div>
                </nav>
            </div>
        </header>

        {{-- Breadcrumb Navigation --}}
        {{-- <nav class="bg-gray-50 border-b border-gray-200" aria-label="Breadcrumb">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center space-x-2 py-3 text-sm">
                    <a href="/" class="text-gray-500 hover:text-gray-700">Home</a>
                    <svg class="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                    @if($product->category)
                        <a href="/search?category_id={{ $product->category->id }}" class="text-gray-500 hover:text-gray-700">{{ $product->category->name }}</a>
                        <svg class="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                    @endif
                    <span class="text-gray-900 font-medium">{{ Str::limit($product->product_name, 50) }}</span>
                </div>
            </div>
        </nav> --}}

        {{-- Main Content --}}
        <main>
            {{ $slot }}
        </main>

        {{-- Footer --}}
        <footer class="bg-gray-900 text-white mt-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 class="text-lg font-semibold mb-4">Customer Service</h3>
                        <ul class="space-y-2">
                            <li><a href="#" class="text-gray-300 hover:text-white transition">Contact Us</a></li>
                            {{-- <li><a href="#" class="text-gray-300 hover:text-white transition">Shipping Info</a></li> --}}
                            <li><a href="#" class="text-gray-300 hover:text-white transition">Returns</a></li>
                            <li><a href="#" class="text-gray-300 hover:text-white transition">FAQ</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold mb-4">Connect</h3>
                        <ul class="space-y-2">
                            <li><a href="#" class="text-gray-300 hover:text-white transition">Facebook</a></li>
                            <li><a href="#" class="text-gray-300 hover:text-white transition">Twitter</a></li>
                            <li><a href="https://www.instagram.com/murphylog_gadgets?igsh=NGNmNXhoeTE0cmU0&utm_source=qr" class="text-gray-300 hover:text-white transition">Instagram</a></li>
                            <li><a href="https://www.tiktok.com/@murphylog_gadgets" class="text-gray-300 hover:text-white transition">TikTok</a></li>
                            <li><a href="#" class="text-gray-300 hover:text-white transition">YouTube</a></li>
                        </ul>
                    </div>
                    {{-- <div>
                        <h3 class="text-lg font-semibold mb-4">Newsletter</h3>
                        <p class="text-gray-300 mb-4">Get the latest deals and tech news</p>
                        <div class="flex">
                            <input type="email" placeholder="Email address" class="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-md focus:outline-none focus:border-blue-500">
                            <button class="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition">Join</button>
                        </div>
                    </div> --}}
                </div>

                <div class="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p class="text-gray-400">&copy; 2025 Zelda Devs. All rights reserved.</p>
                    <div class="flex space-x-4 mt-4 md:mt-0">
                        <a href="#" class="text-gray-400 hover:text-white transition">Privacy</a>
                        <a href="#" class="text-gray-400 hover:text-white transition">Terms</a>
                        <a href="#" class="text-gray-400 hover:text-white transition">Accessibility</a>
                    </div>
                </div>
            </div>
        </footer>

        @livewireScripts

        {{-- Toast / Flash message container --}}
        <div id="flash-toast" class="fixed top-6 right-6 z-50" style="display: none;">
            <div id="flash-inner" class="max-w-sm w-full bg-white shadow-md rounded-md border border-gray-100 px-4 py-3 flex items-center space-x-3">
                <div class="flex-shrink-0 text-green-600">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div>
                    <div id="flash-title" class="text-sm font-medium text-gray-900">Added to cart</div>
                    <div id="flash-body" class="text-xs text-gray-500">Product added to cart.</div>
                </div>
            </div>
        </div>

        <script>
            // Clean up old Alpine cart storage
            document.addEventListener('DOMContentLoaded', function() {
                // Remove Alpine cart storage since we're using React cart now
                localStorage.removeItem('alpineCartCount');
            });

            // React cart integration
            window.reactCartStore = null;

            // Function to get React cart store when available
            function getReactCartStore() {
                if (window.reactCartStore) return window.reactCartStore;

                // Try to get it from Zustand
                try {
                    const { useCartStore } = window;
                    if (useCartStore) {
                        window.reactCartStore = useCartStore.getState();
                        return window.reactCartStore;
                    }
                } catch (e) {
                    console.log('React cart store not yet available');
                }
                return null;
            }

                        // Handle add-to-cart events from anywhere in the app
            window.addEventListener('add-to-cart', function(event) {
                if (event.detail?.productId) {
                    const cartStore = getReactCartStore();
                    if (cartStore && cartStore.getState) {
                        // Use React store
                        cartStore.getState().addToCart(event.detail.productId, 1);
                        console.log('Added to React cart:', event.detail.productId);
                    } else {
                        console.log('React cart store not available');
                    }
                }
            });

            // Handle open-cart events
            window.addEventListener('open-cart', function() {
                const cartStore = getReactCartStore();
                if (cartStore) {
                    cartStore.openCart();
                } else {
                    // Fallback - redirect to cart page
                    window.location.href = '/cart';
                }
            });

            // Category filter functions
            function filterByCategory(categoryId) {
                const url = new URL('/search', window.location.origin);
                if (categoryId) {
                    url.searchParams.set('category_id', categoryId);
                }
                window.location.href = url.toString();
            }

            function filterByCategoryName(categoryName) {
                const url = new URL('/search', window.location.origin);
                if (categoryName) {
                    url.searchParams.set('category', categoryName);
                }
                window.location.href = url.toString();
            }

        </script>

        {{-- React Cart Component --}}
        @include('react.cart')

        {{-- Debug Component (temporary) --}}
        <div data-react-component="CartDebug"></div>

        @livewireScripts
    </body>
</html>
