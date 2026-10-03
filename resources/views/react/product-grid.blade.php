{{--
    React ProductGrid Component. Prop names are lowercase because browsers lowercase attribute names.

    $listing   a page of App\Services\Catalog, when the page prints its first products itself.
               They are in the HTML for shoppers and search engines before any script runs, and
               the grid starts from the same data instead of asking for it again.
    $pageBase  the page's path, for the link to the next page of products
--}}
@php
    use App\Services\Catalog;
    use App\View\Composers\StoreNavigationComposer;

    $gridCategories = StoreNavigationComposer::categories();
    $grid = isset($listing) && $listing ? app(Catalog::class)->forGrid($listing) : null;
    $activeCategory = (string) ($categoryId ?? '');
@endphp
<div
    data-react-component="ProductGrid"
    data-prop-initialsearchquery="{{ $searchQuery ?? '' }}"
    @if($activeCategory !== '')
    data-prop-initialcategoryid="{{ $activeCategory }}"
    @endif
    data-prop-initialcategories="{{ $gridCategories->map(fn ($category) => ['id' => (string) $category->id, 'name' => $category->name])->toJson() }}"
    @if($grid)
    data-prop-initialproducts="{{ json_encode($grid) }}"
    data-prop-pagebase="{{ $pageBase ?? '' }}"
    @endif
    {!! $attributes ?? '' !!}
>
    {{-- The same rows the grid draws: category chips, the count, then the products --}}
    @if($gridCategories->isNotEmpty())
        <div class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <a href="/products" class="chip {{ $activeCategory === '' ? 'chip-active' : '' }}">All</a>
            @foreach($gridCategories as $category)
                <a href="{{ \App\Support\Seo::categoryPath($category) }}" class="chip {{ $activeCategory === (string) $category->id ? 'chip-active' : '' }}">{{ $category->name }}</a>
            @endforeach
        </div>
    @endif

    <div class="mt-4 flex min-h-9 items-center">
        <p class="text-sm text-gray-600">
            @if($grid)
                <span class="font-semibold text-ink tabular-nums">{{ number_format($grid['total']) }}</span> {{ $grid['total'] === 1 ? 'product' : 'products' }}
            @else
                Loading products
            @endif
        </p>
    </div>

    <div class="mt-5">
        @if($grid && count($grid['data']) > 0)
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                @foreach($grid['data'] as $item)
                    @include('partials.product-card', ['item' => $item, 'eager' => $loop->index < 2])
                @endforeach
            </div>

            @if($grid['current_page'] < $grid['last_page'] && ! empty($pageBase))
                <div class="flex justify-center pt-8">
                    <a href="{{ $pageBase }}?page={{ $grid['current_page'] + 1 }}" class="btn btn-outline">Load more products</a>
                </div>
            @endif
        @elseif($grid)
            <div class="panel flex flex-col items-center px-6 py-16 text-center">
                <h3 class="text-lg font-bold">No products here yet</h3>
                <p class="mt-2 max-w-sm text-sm text-gray-600">New stock is added often. Browse everything else in the store.</p>
                <a href="/products" class="btn btn-primary mt-6">Browse all products</a>
            </div>
        @else
            {{-- Placeholder with the grid's shape, shown until the React component mounts --}}
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-hidden="true">
                @for($i = 0; $i < 12; $i++)
                    <div class="rounded-2xl border border-gray-200 bg-white p-2">
                        <div class="aspect-square animate-pulse rounded-xl bg-gray-100"></div>
                        <div class="px-1.5 pt-3 pb-1.5">
                            <div class="h-3.5 w-11/12 animate-pulse rounded-full bg-gray-100"></div>
                            <div class="mt-2 h-3.5 w-2/3 animate-pulse rounded-full bg-gray-100"></div>
                            <div class="mt-3 h-5 w-1/2 animate-pulse rounded-full bg-gray-100"></div>
                        </div>
                    </div>
                @endfor
            </div>
            <noscript>
                <p class="mt-6 text-sm text-gray-600">Turn on JavaScript to see the search results.</p>
            </noscript>
        @endif
    </div>
</div>
