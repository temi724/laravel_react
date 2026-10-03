{{--
    One bundle. $bundle is what App\Services\Offers::presentBundle() returns.

    The server prints the page (what is in the bundle, the price and the saving) for search
    engines and link previews; the React BundleShow component takes over from the same data.
--}}
@php
    use App\Helpers\Money;
    use App\Support\Seo;

    $contents = Seo::bundleContents($bundle);
    $saving = (float) ($bundle['saving'] ?? 0);
    $lead = $contents.' together for '.Money::naira($bundle['price'])
        .($saving > 0 ? ', '.Money::naira($saving).' less than buying each on its own' : '')
        .' at '.Seo::storeName().', Ikeja, Lagos.';
    $firstImage = collect($bundle['items'])->pluck('product.image')->filter()->first();
@endphp

<x-layout
    :title="Seo::title($bundle['name'].' Bundle Deal')"
    :description="Seo::clip($lead)"
    :canonical="Seo::url($bundle['url'])"
    :image="Seo::image($firstImage)"
    og-type="product"
    :schema="[Seo::bundle($bundle), Seo::breadcrumbs([['Home', '/'], [$bundle['name'], $bundle['url']]])]"
>
    <div class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {{-- React BundleShow Component --}}
        <div data-react-component="BundleShow" data-prop-bundle="{{ json_encode($bundle) }}">
            {{-- The same page, printed by the server. It follows the layout of BundleShow.jsx. --}}
            <nav aria-label="Breadcrumb" class="mb-5">
                <ol class="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                    <li><a href="/" class="hover:text-ink">Home</a></li>
                    <li aria-hidden="true"><x-icon name="chevron-right" class="size-3" /></li>
                    <li><a href="/#bundles" class="hover:text-ink">Bundles</a></li>
                    <li aria-hidden="true"><x-icon name="chevron-right" class="size-3" /></li>
                    <li class="max-w-[60vw] truncate text-ink" aria-current="page">{{ $bundle['name'] }}</li>
                </ol>
            </nav>

            <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
                <div>
                    <h1 class="text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">{{ $bundle['name'] }}</h1>
                    @if(! empty($bundle['description']))
                        <p class="mt-2 max-w-[65ch] leading-relaxed whitespace-pre-line text-gray-700">{{ $bundle['description'] }}</p>
                    @endif

                    <h2 class="mt-7 text-base font-bold">In this bundle</h2>
                    <ul class="panel mt-3 divide-y divide-gray-100 px-4 sm:px-6">
                        @foreach($bundle['items'] as $item)
                            @php $product = $item['product'] ?? []; @endphp
                            <li class="flex items-center gap-4 py-4">
                                <span class="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 sm:size-24">
                                    @if(! empty($product['image']))
                                        <img src="{{ $product['image'] }}" alt="{{ $product['product_name'] ?? '' }}" loading="lazy" decoding="async" class="size-full object-cover" onerror="this.remove()">
                                    @endif
                                </span>
                                <div class="min-w-0 flex-1">
                                    <p class="font-semibold">
                                        <a href="{{ $product['url'] ?? '#' }}" class="hover:text-brand">{{ $product['product_name'] ?? 'Product' }}</a>
                                    </p>
                                    <p class="mt-0.5 text-sm text-gray-600">{{ implode(', ', array_filter([$item['storage'] ?? null, $product['category'] ?? null, $item['quantity'] > 1 ? 'Quantity '.$item['quantity'] : null])) }}</p>
                                </div>
                                <p class="shrink-0 text-sm text-gray-600 tabular-nums">{{ Money::naira(($item['unit_price'] ?? 0) * $item['quantity']) }}</p>
                            </li>
                        @endforeach
                    </ul>
                </div>

                <aside class="panel p-5 sm:p-6" aria-label="Bundle price">
                    <dl class="space-y-2 text-sm">
                        <div class="flex items-baseline justify-between gap-4">
                            <dt class="text-gray-600">Bought separately</dt>
                            <dd class="text-gray-600 tabular-nums"><s>{{ Money::naira($bundle['usual_price'] ?? 0) }}</s></dd>
                        </div>
                        @if($saving > 0)
                            <div class="flex items-baseline justify-between gap-4">
                                <dt class="font-semibold text-sale">You save</dt>
                                <dd class="font-semibold text-sale tabular-nums">{{ Money::naira($saving) }}</dd>
                            </div>
                        @endif
                        <div class="flex items-baseline justify-between gap-4 border-t border-gray-200 pt-3">
                            <dt class="font-bold">Bundle price</dt>
                            <dd class="text-3xl font-extrabold tracking-tight tabular-nums">{{ Money::naira($bundle['price']) }}</dd>
                        </div>
                    </dl>
                </aside>
            </div>
        </div>
    </div>
</x-layout>
