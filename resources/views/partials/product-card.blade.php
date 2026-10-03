{{--
    One product card, printed by the server. It is the same card the React ProductCard draws
    (resources/js/components/ProductCard.jsx), so nothing moves when the grid takes over.
    Keep the two in step.

    $item  what App\Services\Catalog::card() returns
    $eager true for the first cards of a page, which are on screen straight away
--}}
@php
    $image = $item['images_url'][0] ?? null;
    $isDeal = ($item['type'] ?? 'product') === 'deal';
    $price = (float) ($item['display_price'] ?? $item['price']);
    $before = (float) ($item['old_price'] ?? 0);
    $discount = $isDeal && $before > (float) $item['price'] ? (int) round(($before - (float) $item['price']) / $before * 100) : 0;
    $condition = ['new' => 'New', 'uk_used' => 'UK used', 'refurbished' => 'Refurbished'][$item['product_status'] ?? 'new']
        ?? \Illuminate\Support\Str::headline((string) $item['product_status']);
    $meta = implode(' · ', array_filter([$item['category']['name'] ?? null, $item['default_storage'] ?? null]));
@endphp
<article class="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-2 text-ink">
    <a href="{{ $item['url'] }}" class="relative block aspect-square overflow-hidden rounded-xl bg-gray-100" tabindex="-1" aria-hidden="true">
        @if($image)
            <img
                src="{{ $image }}"
                alt="{{ $item['product_name'] }}"
                @if($eager ?? false) fetchpriority="high" @else loading="lazy" @endif
                decoding="async"
                class="size-full object-cover {{ $item['in_stock'] ? '' : 'opacity-60' }}"
                onerror="this.remove()"
            >
        @endif

        @if($item['in_stock'])
            <span class="absolute top-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] leading-none font-semibold text-ink">{{ $condition }}</span>
        @else
            <span class="absolute top-2 left-2 rounded-full bg-ink px-2.5 py-1 text-[11px] leading-none font-semibold text-white">Out of stock</span>
        @endif
    </a>

    <div class="flex flex-1 flex-col px-1.5 pt-3 pb-1.5">
        <h3 class="line-clamp-2 min-h-10 text-sm leading-5 font-medium">
            <a href="{{ $item['url'] }}" class="rounded-sm">{{ $item['product_name'] }}</a>
        </h3>

        <div class="mt-auto flex items-end justify-between gap-2 pt-2">
            <div class="min-w-0">
                <p class="text-lg leading-6 font-extrabold tracking-tight tabular-nums">{{ \App\Helpers\Money::naira($price) }}</p>
                @if($discount > 0)
                    <p class="text-xs leading-5 text-gray-500 tabular-nums">
                        <s>{{ \App\Helpers\Money::naira($before) }}</s>
                        <span class="font-semibold text-sale">-{{ $discount }}%</span>
                    </p>
                @endif
                @if($meta !== '')
                    <p class="truncate text-xs leading-5 text-gray-500">{{ $meta }}</p>
                @endif
            </div>

            {{-- The place of the add button, which arrives with the scripts --}}
            @if($item['in_stock'])
                <span class="size-9 shrink-0 rounded-full border border-gray-300" aria-hidden="true"></span>
            @endif
        </div>
    </div>
</article>
