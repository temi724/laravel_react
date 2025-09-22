<x-product-layout :product="$product">
    <x-slot name="title">{{ $product->product_name }} - {{ config('app.name') }}</x-slot>

    {{-- SEO-optimized meta description --}}
    <x-slot name="metaDescription">
        @if($product->overview)
            {{ Str::limit(strip_tags($product->overview), 160) }}
        @elseif($product->description)
            {{ Str::limit(strip_tags($product->description), 160) }}
        @else
            Buy {{ $product->product_name }} at {{ config('app.name') }}.
            @if($product->category)Quality {{ $product->category->name }} @endif
            at affordable prices. {{ $product->in_stock ? 'In stock' : 'Limited availability' }}. Fast delivery nationwide.
        @endif
    </x-slot>

    {{-- SEO keywords --}}
    <x-slot name="metaKeywords">
        {{ $product->product_name }},
        @if($product->category){{ $product->category->name }}, @endif
        gadgets, electronics, Nigeria, Lagos, online store, buy online, {{ config('app.name') }}
    </x-slot>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {{-- React ProductShow Component --}}
        <div
            data-react-component="ProductShow"
            data-prop-productid="{{ $product->id }}"
            data-prop-producttype="{{ $type }}"
        ></div>

        {{-- SEO-friendly fallback content for crawlers --}}
        <noscript>
            <div class="bg-white rounded-lg shadow-sm p-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ $product->product_name }}</h1>

                @if($product->images_url && count($product->images_url) > 0)
                    <div class="mb-6">
                        <img src="{{ $product->images_url[0] }}"
                             alt="{{ $product->product_name }}"
                             class="w-full max-w-md mx-auto rounded-lg">
                    </div>
                @endif

                <div class="mb-6">
                    <span class="text-3xl font-bold text-blue-600">₦{{ number_format($product->price, 2) }}</span>
                    @if($product->in_stock)
                        <span class="ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            In Stock
                        </span>
                    @else
                        <span class="ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            Out of Stock
                        </span>
                    @endif
                </div>

                @if($product->overview)
                    <div class="mb-6">
                        <h2 class="text-xl font-semibold mb-3">Overview</h2>
                        <p class="text-gray-700">{!! $product->overview !!}</p>
                    </div>
                @endif

                @if($product->description)
                    <div class="mb-6">
                        <h2 class="text-xl font-semibold mb-3">Description</h2>
                        <div class="text-gray-700">{!! $product->description !!}</div>
                    </div>
                @endif

                @if($product->specification)
                    <div class="mb-6">
                        <h2 class="text-xl font-semibold mb-3">Specifications</h2>
                        @php
                            $specs = is_string($product->specification) ? json_decode($product->specification, true) : $product->specification;
                        @endphp
                        @if($specs)
                            <dl class="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                                @foreach($specs as $key => $value)
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">{{ ucfirst(str_replace('_', ' ', $key)) }}</dt>
                                        <dd class="text-sm text-gray-900">{{ is_array($value) ? implode(', ', $value) : $value }}</dd>
                                    </div>
                                @endforeach
                            </dl>
                        @endif
                    </div>
                @endif
            </div>
        </noscript>
    </div>
</x-product-layout>
