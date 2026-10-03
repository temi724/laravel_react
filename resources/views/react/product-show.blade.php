{{--
    A product or flash deal. $product and $type come from the /product route.

    The page is printed in full by the server: name, photo, price, stock, description,
    specifications and links to more of the same category. Search engines and link previews read
    that; the React ProductShow component then takes over from the same data, sent along
    as JSON, without asking for it again.
--}}
@php
    use App\Helpers\Money;
    use App\Services\Catalog;
    use App\Support\Seo;

    $path = Seo::productPath($product);
    $category = $product->category;
    $images = array_values(array_filter((array) $product->images_url));
    $price = Seo::price($product);
    $before = (float) ($product->old_price ?? 0);
    $condition = ucfirst(Seo::conditionLabel($product->product_status));
    $specs = collect((array) $product->specification);
    $included = collect(is_array($product->what_is_included) ? $product->what_is_included : preg_split('/\R/', (string) $product->what_is_included))
        ->map(fn ($line) => trim((string) $line))->filter();

    $catalog = app(Catalog::class);
    $related = $catalog->related($product);

    $trail = array_values(array_filter([
        ['Home', '/'],
        $category ? [$category->name, Seo::categoryPath($category)] : null,
        [$product->product_name, $path],
    ]));
@endphp

<x-layout
    :title="Seo::productTitle($product)"
    :description="Seo::productDescription($product)"
    :canonical="Seo::url($path)"
    :image="Seo::image($images[0] ?? null)"
    og-type="product"
    :schema="[Seo::product($product), Seo::breadcrumbs($trail)]"
>
    <x-slot name="head">
        <meta property="product:price:amount" content="{{ number_format($price, 2, '.', '') }}">
        <meta property="product:price:currency" content="NGN">
        <meta property="product:availability" content="{{ $product->in_stock ? 'in stock' : 'out of stock' }}">
        <meta property="product:condition" content="{{ $product->product_status === 'new' ? 'new' : ($product->product_status === 'refurbished' ? 'refurbished' : 'used') }}">
        @if(! empty($images[0]))
            <link rel="preload" as="image" href="{{ $images[0] }}" fetchpriority="high">
        @endif
    </x-slot>

    <div class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div
            data-react-component="ProductShow"
            data-prop-productid="{{ $product->id }}"
            data-prop-producttype="{{ $type }}"
            data-prop-initial="{{ json_encode($product->toArray() + ['type' => $type]) }}"
        >
            {{-- The same page, printed by the server. It follows the layout of ProductShow.jsx so the handover is not seen. --}}
            <div class="pb-20 lg:pb-0">
                <nav aria-label="Breadcrumb" class="mb-5">
                    <ol class="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                        <li><a href="/" class="hover:text-ink">Home</a></li>
                        <li aria-hidden="true"><x-icon name="chevron-right" class="size-3" /></li>
                        @if($category)
                            <li><a href="{{ Seo::categoryPath($category) }}" class="hover:text-ink">{{ $category->name }}</a></li>
                            <li aria-hidden="true"><x-icon name="chevron-right" class="size-3" /></li>
                        @endif
                        <li class="max-w-[60vw] truncate text-ink" aria-current="page">{{ $product->product_name }}</li>
                    </ol>
                </nav>

                <div class="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
                    <div>
                        <div class="panel flex aspect-square items-center justify-center overflow-hidden">
                            @if(! empty($images[0]))
                                <img
                                    src="{{ $images[0] }}"
                                    alt="{{ $product->product_name }}"
                                    fetchpriority="high"
                                    decoding="async"
                                    class="size-full object-contain p-4 sm:p-8"
                                    onerror="this.remove()"
                                >
                            @endif
                        </div>
                    </div>

                    <div>
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">{{ $condition }}</span>
                            @if($product->in_stock)
                                <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">In stock</span>
                            @else
                                <span class="rounded-full bg-sale-light px-3 py-1 text-xs font-semibold text-sale">Out of stock</span>
                            @endif
                        </div>

                        <h1 class="mt-3 text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">{{ $product->product_name }}</h1>

                        @if($type === 'product' && $category)
                            <p class="mt-2 text-sm text-gray-600">
                                In <a href="{{ Seo::categoryPath($category) }}" class="font-semibold text-brand hover:text-brand-dark">{{ $category->name }}</a>
                            </p>
                        @endif

                        <div class="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span class="text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">{{ Money::naira($price) }}</span>
                            @if($type === 'deal' && $before > $price)
                                <s class="text-lg text-gray-500 tabular-nums">{{ Money::naira($before) }}</s>
                            @endif
                        </div>

                        @if(trim((string) $product->overview) !== '')
                            <p class="mt-5 leading-relaxed text-gray-700">{{ $product->overview }}</p>
                        @endif

                        <ul class="mt-6 space-y-2 text-sm text-gray-700">
                            <li>Pick up at {{ config('store.address.line') }}, Ikeja</li>
                            <li>Delivery to {{ lcfirst(config('store.delivery')) }}</li>
                            <li>Pay by bank transfer at checkout</li>
                        </ul>
                    </div>
                </div>

                <section class="mt-12 lg:mt-16" aria-label="Product details">
                    <div class="panel space-y-8 p-5 sm:p-8">
                        @if($included->isNotEmpty())
                            <div>
                                <h2 class="text-lg font-bold">What is included</h2>
                                <ul class="mt-3 flex flex-wrap gap-2">
                                    @foreach($included as $line)
                                        <li class="rounded-full bg-gray-100 px-3.5 py-1.5 text-sm">{{ $line }}</li>
                                    @endforeach
                                </ul>
                            </div>
                        @endif

                        @if(trim((string) $product->description) !== '')
                            <div>
                                <h2 class="text-lg font-bold">Description</h2>
                                <p class="mt-3 max-w-[70ch] leading-relaxed whitespace-pre-line text-gray-700">{{ $product->description }}</p>
                            </div>
                        @endif

                        @if(trim((string) $product->about) !== '')
                            <div>
                                <h2 class="text-lg font-bold">Key features</h2>
                                <p class="mt-3 max-w-[70ch] leading-relaxed text-gray-700">{{ $product->about }}</p>
                            </div>
                        @endif

                        @if($specs->isNotEmpty())
                            <div>
                                <h2 class="text-lg font-bold">Specifications</h2>
                                <dl class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    @foreach($specs as $name => $value)
                                        {{-- Grouped specifications are listed one level down --}}
                                        @foreach(is_array($value) && ! array_is_list($value) ? $value : [$name => $value] as $key => $item)
                                            <div class="rounded-2xl bg-gray-50 px-4 py-3">
                                                <dt class="text-xs text-gray-500">{{ \Illuminate\Support\Str::headline((string) $key) }}</dt>
                                                <dd class="mt-0.5 text-sm font-semibold">{{ is_array($item) ? implode(', ', array_filter($item, 'is_scalar')) : $item }}</dd>
                                            </div>
                                        @endforeach
                                    @endforeach
                                </dl>
                            </div>
                        @endif
                    </div>
                </section>

                @if($related->isNotEmpty())
                    <section class="mt-12 lg:mt-16">
                        <h2 class="mb-5 text-2xl font-extrabold tracking-tight">{{ $category ? 'More in '.$category->name : 'More products' }}</h2>
                        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
                            @foreach($related as $item)
                                @include('partials.product-card', ['item' => $catalog->card($item), 'eager' => false])
                            @endforeach
                        </div>
                    </section>
                @endif
            </div>
        </div>
    </div>
</x-layout>
