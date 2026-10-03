@php
    use App\Support\Seo;

    $rotatingWords = ['laptop', 'phone', 'tablet', 'console', 'headset'];
@endphp

{{-- The home page names the shop to search engines: who it is, where it is and what it lists --}}
<x-layout
    :canonical="Seo::url('/')"
    :image="Seo::defaultImage() ?? Seo::image($showcase->first()?->images_url[0] ?? null)"
    :schema="[Seo::store(), Seo::website(), Seo::itemList($listing['data'], 'Products at '.Seo::storeName())]"
>

    {{-- Hero: one message on the left, the newest products on the right --}}
    <section class="bg-ink text-white">
        <div class="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-8 px-4 pt-8 pb-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-8 lg:pt-12 lg:pb-14">
            <div>
                <h1 class="text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                    Find your next
                    {{-- The word changes every few seconds to show the range. It stays on the first word when motion is reduced. --}}
                    <span
                        class="relative block text-brand-soft"
                        x-data="{ current: 0, total: {{ count($rotatingWords) }} }"
                        x-init="if (! window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setInterval(() => current = (current + 1) % total, 2600) }"
                    >
                        @foreach($rotatingWords as $index => $word)
                            <span
                                x-show="current === {{ $index }}"
                                x-transition:enter="transition-[opacity,transform] duration-500 ease-out"
                                x-transition:enter-start="translate-y-3 opacity-0"
                                x-transition:enter-end="translate-y-0 opacity-100"
                                x-transition:leave="absolute inset-x-0 top-0 transition-[opacity,transform] duration-300 ease-out"
                                x-transition:leave-start="translate-y-0 opacity-100"
                                x-transition:leave-end="-translate-y-3 opacity-0"
                                class="block capitalize"
                                @if($index > 0) x-cloak @endif
                            >{{ $word }}</span>
                        @endforeach
                    </span>
                </h1>

                <p class="mt-5 max-w-[46ch] text-base leading-relaxed text-white/70 sm:text-lg">
                    Brand new and UK used devices at fair prices. Pick up in Ikeja or get delivery anywhere in Nigeria.
                </p>

                <div class="mt-7 flex flex-wrap gap-3">
                    <a href="#products" class="btn btn-lg btn-primary">
                        Shop now
                        <x-icon name="arrow-right" />
                    </a>
                    @if($deals->isNotEmpty())
                        <a href="#deals" class="btn btn-lg btn-on-ink">
                            <x-icon name="flash" />
                            View deals
                        </a>
                    @endif
                </div>
            </div>

            {{-- Showcase: the newest in-stock products. One is featured at a time and the thumbnails switch it. --}}
            @if($showcase->isNotEmpty())
                <div
                    x-data="{ active: 0, total: {{ $showcase->count() }}, paused: false }"
                    x-init="if (total > 1 && ! window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setInterval(() => { if (! paused) active = (active + 1) % total }, 4500) }"
                    @mouseenter="paused = true"
                    @mouseleave="paused = false"
                    @focusin="paused = true"
                    @focusout="paused = false"
                >
                    <div class="relative overflow-hidden rounded-3xl bg-white text-ink">
                        @foreach($showcase as $index => $product)
                            @php
                                $productUrl = $product->url;
                                $image = $product->images_url[0] ?? null;
                            @endphp
                            <a
                                href="{{ $productUrl }}"
                                x-show="active === {{ $index }}"
                                x-transition:enter="transition-opacity duration-500 ease-out"
                                x-transition:enter-start="opacity-0"
                                x-transition:enter-end="opacity-100"
                                x-transition:leave="absolute inset-0 transition-opacity duration-300 ease-out"
                                x-transition:leave-start="opacity-100"
                                x-transition:leave-end="opacity-0"
                                class="flex items-stretch gap-4 p-3 sm:gap-6 sm:p-4"
                                @if($index > 0) x-cloak @endif
                            >
                                <span class="relative flex aspect-square w-2/5 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-gray-300 sm:w-1/2">
                                    <x-icon name="image" class="size-10" />
                                    @if($image)
                                        <img
                                            src="{{ $image }}"
                                            alt="{{ $product->product_name }}"
                                            class="absolute inset-0 size-full object-cover"
                                            @if($index === 0) fetchpriority="high" @else loading="lazy" @endif
                                            onerror="this.remove()"
                                        >
                                    @endif
                                </span>
                                <span class="flex min-w-0 flex-1 flex-col justify-center py-1 pr-1 sm:pr-3">
                                    <span class="text-xs font-semibold text-gray-500">Just in</span>
                                    <span class="mt-1.5 line-clamp-3 text-base leading-snug font-bold sm:text-xl">{{ $product->product_name }}</span>
                                    <span class="mt-3 text-xl font-extrabold tracking-tight tabular-nums sm:text-2xl">{{ \App\Helpers\Money::naira($product->display_price) }}</span>
                                    <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                                        View product
                                        <x-icon name="chevron-right" class="size-4" />
                                    </span>
                                </span>
                            </a>
                        @endforeach
                    </div>

                    @if($showcase->count() > 1)
                        <div class="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
                            @foreach($showcase as $index => $product)
                                @php $image = $product->images_url[0] ?? null; @endphp
                                <button
                                    type="button"
                                    @click="active = {{ $index }}"
                                    :aria-pressed="active === {{ $index }}"
                                    :class="active === {{ $index }} ? 'border-white bg-white/15' : 'border-white/10 bg-white/5 hover:border-white/40'"
                                    class="flex items-center gap-2 rounded-2xl border p-1.5 text-left transition-colors"
                                    aria-label="Show {{ $product->product_name }}"
                                >
                                    <span class="relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 text-white/40 sm:w-11">
                                        <x-icon name="image" class="size-4" />
                                        @if($image)
                                            <img src="{{ $image }}" alt="" loading="lazy" class="absolute inset-0 size-full object-cover" onerror="this.remove()">
                                        @endif
                                    </span>
                                    <span class="hidden min-w-0 flex-1 truncate text-xs font-medium text-white/80 sm:block">{{ $product->product_name }}</span>
                                </button>
                            @endforeach
                        </div>
                    @endif
                </div>
            @endif
        </div>
    </section>

    {{-- What to expect when buying --}}
    <section class="border-b border-gray-200 bg-white" aria-label="How buying works">
        <ul class="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-4 gap-y-4 px-4 py-5 sm:gap-y-5 sm:px-6 sm:py-6 lg:grid-cols-4 lg:px-8">
            <li class="flex items-center gap-3 sm:items-start">
                <x-icon name="shop" class="size-6 shrink-0 text-brand sm:mt-0.5" />
                <div>
                    <p class="text-sm font-bold">Store pickup in Ikeja</p>
                    <p class="hidden text-sm text-gray-600 sm:block">{{ config('store.hours') }}</p>
                </div>
            </li>
            <li class="flex items-center gap-3 sm:items-start">
                <x-icon name="truck" class="size-6 shrink-0 text-brand sm:mt-0.5" />
                <div>
                    <p class="text-sm font-bold">Delivery nationwide</p>
                    <p class="hidden text-sm text-gray-600 sm:block">{{ config('store.delivery') }}</p>
                </div>
            </li>
            <li class="flex items-center gap-3 sm:items-start">
                <x-icon name="bank" class="size-6 shrink-0 text-brand sm:mt-0.5" />
                <div>
                    <p class="text-sm font-bold">Pay by bank transfer</p>
                    <p class="hidden text-sm text-gray-600 sm:block">Account details at checkout</p>
                </div>
            </li>
            <li class="flex items-center gap-3 sm:items-start">
                <x-icon name="shield" class="size-6 shrink-0 text-brand sm:mt-0.5" />
                <div>
                    <p class="text-sm font-bold">New and UK used</p>
                    <p class="hidden text-sm text-gray-600 sm:block">Condition shown on every item</p>
                </div>
            </li>
        </ul>
    </section>

    {{-- Deal of the day: one product at a special price until the countdown ends (shows only while a deal runs) --}}
    {{-- Today's deal. The server prints it in the shape DealOfTheDay.jsx draws, so the page
         below does not jump when the component mounts, and the deal is in the HTML itself. --}}
    <div data-react-component="DealOfTheDay">
        @if($deal = \App\View\Composers\StoreOffersComposer::offers()['deal_of_day'] ?? null)
            @php
                $dealProduct = $deal['product'];
                $dealSaving = max(0, (float) ($deal['usual_price'] ?? 0) - (float) $deal['price']);
                $dealLeft = $deal['ends_at'] ? max(0, now()->diffInSeconds(\Illuminate\Support\Carbon::parse($deal['ends_at']), false)) : null;
            @endphp
            <section class="mx-auto max-w-[1440px] px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
                <div class="grid grid-cols-1 overflow-hidden rounded-3xl border border-gray-200 bg-white md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                    <a href="{{ $dealProduct['url'] }}" class="block bg-gray-100" tabindex="-1" aria-hidden="true">
                        <span class="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gray-100 md:aspect-auto md:h-full md:min-h-80">
                            @if($dealProduct['image'])
                                <img src="{{ $dealProduct['image'] }}" alt="{{ $dealProduct['product_name'] }}" decoding="async" class="size-full object-cover" onerror="this.remove()">
                            @endif
                        </span>
                    </a>

                    <div class="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
                        <div class="flex flex-wrap items-center gap-2">
                            <h2 class="rounded-full bg-sale px-3 py-1 text-xs font-bold text-white">Deal of the day</h2>
                            <span class="text-xs font-semibold text-gray-600">{{ ['new' => 'New', 'uk_used' => 'UK used', 'refurbished' => 'Refurbished'][$dealProduct['product_status']] ?? 'New' }}</span>
                        </div>

                        <p class="mt-3 text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
                            <a href="{{ $dealProduct['url'] }}" class="hover:text-brand">{{ $deal['headline'] ?: $dealProduct['product_name'] }}{{ $deal['storage'] ? ' '.$deal['storage'] : '' }}</a>
                        </p>
                        @if($deal['headline'])
                            <p class="mt-1 text-sm text-gray-600">{{ $dealProduct['product_name'] }}</p>
                        @endif
                        @if($dealProduct['overview'])
                            <p class="mt-2 line-clamp-2 max-w-[52ch] text-sm leading-relaxed text-gray-700">{{ $dealProduct['overview'] }}</p>
                        @endif

                        <div class="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span class="text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">{{ \App\Helpers\Money::naira($deal['price']) }}</span>
                            @if($dealSaving > 0)
                                <s class="text-lg text-gray-500 tabular-nums">{{ \App\Helpers\Money::naira($deal['usual_price']) }}</s>
                                <span class="rounded-full bg-sale-light px-2.5 py-1 text-xs font-bold text-sale">Save {{ \App\Helpers\Money::naira($dealSaving) }}</span>
                            @endif
                        </div>

                        @if($dealLeft !== null)
                            <div class="mt-6">
                                <p class="mb-2 text-sm font-semibold">{{ $dealSaving > 0 ? 'Back to '.\App\Helpers\Money::naira($deal['usual_price']).' in' : 'This price ends in' }}</p>
                                <div class="flex items-start gap-1.5" aria-hidden="true">
                                    @foreach(array_filter(['days' => intdiv((int) $dealLeft, 86400) ?: null, 'hrs' => intdiv((int) $dealLeft % 86400, 3600), 'min' => intdiv((int) $dealLeft % 3600, 60), 'sec' => (int) $dealLeft % 60], fn ($value) => $value !== null) as $unit => $value)
                                        <div class="flex flex-col items-center gap-1">
                                            <span class="flex h-12 min-w-12 items-center justify-center rounded-xl bg-ink px-2 text-xl font-extrabold text-white tabular-nums">{{ str_pad((string) $value, 2, '0', STR_PAD_LEFT) }}</span>
                                            <span class="text-[11px] font-semibold text-gray-500">{{ $unit }}</span>
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        @endif

                        <div class="mt-6 flex flex-wrap items-center gap-3">
                            <a href="{{ $dealProduct['url'] }}" class="btn btn-lg btn-primary">Add to cart</a>
                            <a href="{{ $dealProduct['url'] }}" class="btn btn-lg btn-outline">See full details</a>
                        </div>

                        @php
                            // The same wording as leftAtPrice() and orderLimit() in resources/js/lib/offers.js
                            $left = $deal['remaining'];
                            $dealNotes = array_filter([
                                $left === null || $left <= 0 ? null : ($left === 1 ? 'Last one at this price' : ($left <= 5 ? 'Only ' : '').$left.' left at this price'),
                                $deal['per_order_limit'] ? 'Limit '.$deal['per_order_limit'].' per order, so more people get one' : null,
                            ]);
                        @endphp
                        @if($dealNotes)
                            <p class="mt-3 text-sm text-gray-600">{{ implode('. ', $dealNotes) }}.</p>
                        @endif
                    </div>
                </div>
            </section>
        @endif
    </div>

    {{-- Flash Deals --}}
    @if($deals->isNotEmpty())
        {{-- A solid band of the brand colour sets the deals apart from the rest of the page --}}
        <section class="scroll-mt-28 bg-brand py-9 text-white sm:py-11" id="deals">
            <div class="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
                <div class="mb-5 flex items-center gap-3 sm:mb-6">
                    <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-brand">
                        <x-icon name="flash" class="size-6" />
                    </span>
                    <div class="min-w-0">
                        <h2 class="text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">Flash deals</h2>
                        <p class="text-sm text-white/85">Limited time offers while stock lasts.</p>
                    </div>
                </div>

                <div data-react-component="ProductRail" data-prop-type="deal" data-prop-items="{{ $deals->toJson() }}"></div>
            </div>
        </section>
    @endif

    {{-- Drops: limited units released at a set time (shows only when there are drops) --}}
    <div data-react-component="DropsRail"></div>

    {{-- Bundles: products that go together, for one price (shows only when there are bundles) --}}
    <div data-react-component="BundleRail"></div>

    {{-- Products --}}
    <section class="scroll-mt-32 pt-10" id="products">
        <div class="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <h2 class="mb-5 text-2xl font-extrabold tracking-tight sm:text-3xl">All products</h2>

            @include('react.product-grid', ['listing' => $listing, 'pageBase' => '/products'])
        </div>
    </section>
</x-layout>
