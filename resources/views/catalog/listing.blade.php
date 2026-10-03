{{-- A page that lists products: all of them, one category, or search results (CatalogController) --}}
@php
    use App\Support\Seo;

    $indexable = ! str_contains((string) ($robots ?? ''), 'noindex');
    $page = $listing['current_page'] ?? 1;
    // Each page of a listing is its own page, with its own address
    $canonical = $pageBase ? Seo::url($pageBase).($page > 1 ? '?page='.$page : '') : null;
    $schema = $indexable && $listing
        ? [Seo::breadcrumbs($trail), Seo::itemList($listing['data'], $heading)]
        : [];
@endphp

<x-layout :title="$title" :description="$description ?? null" :canonical="$canonical" :robots="$robots ?? null" :schema="$schema">
    <div class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <nav aria-label="Breadcrumb" class="mb-3">
            <ol class="flex items-center gap-1.5 text-sm text-gray-500">
                <li><a href="/" class="hover:text-ink">Home</a></li>
                <li aria-hidden="true"><x-icon name="chevron-right" class="size-3" /></li>
                <li class="text-ink" aria-current="page">{{ $trail[array_key_last($trail)][0] }}</li>
            </ol>
        </nav>

        <h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{{ $heading }}</h1>
        @if(! empty($intro))
            <p class="mt-2 max-w-[70ch] text-sm leading-relaxed text-gray-600 sm:text-base">{{ $intro }}</p>
        @endif

        <div class="mt-5">
            @include('react.product-grid', [
                'searchQuery' => $searchQuery ?? '',
                'categoryId' => $categoryId ?? '',
                'listing' => $listing,
                'pageBase' => $pageBase,
            ])
        </div>
    </div>
</x-layout>
