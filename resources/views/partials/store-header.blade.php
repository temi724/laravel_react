{{-- Storefront header. $navCategories and $navHasDeals come from StoreNavigationComposer. --}}
@php
    $hasLogo = is_file(public_path('images/murphylogo.png'));
    // The category being viewed: its own page, or a search narrowed to it
    $activeCategory = request()->routeIs('category.show')
        ? (string) $navCategories->firstWhere('slug', request()->route('slug'))?->id
        : (string) request('category_id', '');
@endphp

<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink">
    Skip to content
</a>

{{-- The whole header stays pinned: the main bar, and the category row under it --}}
{{-- x-data gives the cart button its Alpine scope, so the click opens the cart drawer --}}
<header class="sticky top-0 z-40 bg-ink text-white" x-data>
    <div class="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:h-[72px] lg:gap-8 lg:px-8">
        <a href="/" class="flex shrink-0 items-center gap-2.5" aria-label="{{ config('store.name') }} home">
            @if($hasLogo)
                <span class="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
                    <img src="{{ asset('images/murphylogo.png') }}" alt="" class="max-h-full max-w-full object-contain">
                </span>
            @endif
            <span class="text-lg font-extrabold tracking-tight {{ $hasLogo ? 'hidden sm:block' : '' }}">
                Murphylog<span class="hidden font-medium text-white/60 lg:inline"> Global</span>
            </span>
        </a>

        <div class="min-w-0 flex-1 lg:mx-auto lg:max-w-2xl">
            @include('react.search-bar')
        </div>

        <a href="tel:{{ config('store.phone') }}" class="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white xl:flex">
            <x-icon name="call" class="size-[18px] shrink-0" />
            {{ config('store.phone_display') }}
        </a>

        <a href="{{ route('cart.index') }}" @click.prevent="$dispatch('open-cart')" class="btn btn-primary relative shrink-0 px-3.5 sm:px-5" aria-label="Open cart">
            <x-icon name="cart" />
            <span class="hidden sm:inline">Cart</span>
            <span data-react-component="CartCounter"></span>
        </a>
    </div>

    {{-- Category row: pinned with the main bar, so a category is one tap away from anywhere on the page.
         Anchored sections and sticky side panels allow for both rows (scroll-mt-28 / scroll-mt-32, lg:top-36). --}}
    <nav aria-label="Categories">
        <div class="mx-auto flex max-w-[1440px] items-center gap-4 border-t border-white/10 px-4 sm:px-6 lg:px-8">
            <div class="no-scrollbar -mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 py-2">
                <a href="/#products" class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors {{ $activeCategory === '' && (request()->is('/') || request()->routeIs('products.index')) ? 'bg-white text-ink' : 'text-white hover:bg-white/10' }}">
                    <x-icon name="category" class="size-4 shrink-0" />
                    All products
                </a>
                @foreach($navCategories as $category)
                    <a href="{{ \App\Support\Seo::categoryPath($category) }}"
                       @if($activeCategory === (string) $category->id) aria-current="page" @endif
                       class="inline-flex h-8 shrink-0 items-center rounded-full px-3 text-sm font-medium transition-colors {{ $activeCategory === (string) $category->id ? 'bg-white text-ink' : 'text-white/75 hover:bg-white/10 hover:text-white' }}">
                        {{ $category->name }}
                    </a>
                @endforeach
            </div>

            @if($navHasDeals)
                <a href="/#deals" class="hidden h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 md:inline-flex">
                    <x-icon name="flash" class="size-4 shrink-0" />
                    Deals
                </a>
            @endif
        </div>
    </nav>
</header>
