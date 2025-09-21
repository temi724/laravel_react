<x-layout>
    <x-slot name="title">Murphylog global</x-slot>

<section class="relative bg-cover bg-center" style="background-image: url('{{ asset('images/store.jpg') }}');">
    <!-- Overlay for readability -->
    <div class="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-blue-900/80"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10 text-white">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
                <h1 class="text-4xl lg:text-6xl font-bold mb-6">
                    Need a Gadget?<br>
                    <span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Check Out Our List!
                    </span>
                </h1>
                <p class="text-xl text-blue-100 mb-8 max-w-md">
                    Discover our collection of affordable gadgets, smartphones, laptops, and cutting-edge tech. Quality meets affordability!
                </p>
                <div class="flex flex-col sm:flex-row gap-4">
                    <a href="#products" class="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition text-center">
                        Shop Now
                    </a>
                    <a href="#deals" class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition text-center">
                        View Deals
                    </a>
                </div>
            </div>
            <div class="relative">
                <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                    <div class="space-y-6">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <div class="font-semibold">Latest Smartphones</div>
                                <div class="text-blue-200 text-sm">From ₦100,000</div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <div class="font-semibold">Gaming Laptops</div>
                                <div class="text-blue-200 text-sm">Up to 50% Off</div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 11V9a3 3 0 116 0v2m-3 9a7 7 0 100-14 7 7 0 000 14z"></path>
                                </svg>
                            </div>
                            <div>
                                <div class="font-semibold">Smart Home</div>
                                <div class="text-blue-200 text-sm">Free Installation</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

    <!-- Flash Deals -->
    <section class="py-16" id="deals">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">⚡ Flash Deals</h2>
                    <p class="text-gray-600">Limited time offers - Don't miss out!</p>
                </div>
                {{-- <div class="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-semibold" x-data="countdown()" x-text="timeLeft">

                </div> --}}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @php
                    $deals = \App\Models\Deal::inStock()->take(6)->get();
                @endphp

                @forelse($deals as $deal)
                    <a href="{{ route('product.show', $deal->id) }}" class="bg-white rounded-xl border border-gray-100 hover:border-gray-200 overflow-hidden group transition-all duration-200 block">
                        <div class="relative">
                            @if($deal->images_url && count($deal->images_url) > 0)
                                <img
                                    src="{{ $deal->images_url[0] }}"
                                    alt="{{ $deal->product_name }}"
                                    class="w-full aspect-video object-cover"
                                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                                >
                                <div class="absolute inset-0 flex items-center justify-center" style="display: none;">
                                    <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                            @else
                                <div class="w-full aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                            @endif
                            @if($deal->old_price && $deal->old_price > $deal->price)
                                @php
                                    $discountPercentage = round((($deal->old_price - $deal->price) / $deal->old_price) * 100);
                                @endphp
                                <div class="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                                    {{ $discountPercentage }}% OFF
                                </div>
                            @endif
                        </div>
                        <div class="p-6">
                            <h3 class="font-semibold text-gray-900 mb-3 px-1">{{ $deal->product_name }}</h3>
                            <div class="flex items-center space-x-2 mb-5 px-1">
                                <span class="text-2xl font-bold text-gray-900">₦{{ number_format($deal->price, 0) }}</span>
                                @if($deal->old_price && $deal->old_price > $deal->price)
                                    <span class="text-lg text-gray-500 line-through">₦{{ number_format($deal->old_price, 0) }}</span>
                                    <span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
                                        Save ₦{{ number_format($deal->old_price - $deal->price, 0) }}
                                    </span>
                                @endif
                            </div>
                            <div class="flex items-center justify-between px-1">
                                <span class="text-sm font-medium text-gray-600">⚡ Flash Deal</span>
                                <button
                                    onclick="event.preventDefault(); event.stopPropagation(); window.dispatchEvent(new CustomEvent('add-to-cart', { detail: { productId: '{{ $deal->id }}', type: 'deal' } }));"
                                    class="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors group"
                                >
                                    {{-- <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2 3L2.26491 3.0883C3.58495 3.52832 4.24497 3.74832 4.62248 4.2721C5 4.79587 5 5.49159 5 6.88304V9.5C5 12.7875 5 14.4312 5.90796 15.5376C6.07418 15.7401 6.25989 15.9258 6.46243 16.092C7.56878 17 9.21252 17 12.5 17C15.7875 17 17.4312 17 18.5376 16.092C18.7401 15.9258 18.9258 15.7401 19.092 15.5376C20 14.4312 20 12.7875 20 9.5V8.5C20 7.09554 20 6.39331 19.6532 5.88886C19.3065 5.38441 18.6851 5.18885 17.4422 4.79773L12.5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                        <path d="M7.5 18C8.32843 18 9 18.6716 9 19.5C9 20.3284 8.32843 21 7.5 21C6.67157 21 6 20.3284 6 19.5C6 18.6716 6.67157 18 7.5 18Z" stroke="currentColor" stroke-width="1.5"/>
                                        <path d="M16.5 18.0001C17.3284 18.0001 18 18.6716 18 19.5001C18 20.3285 17.3284 21.0001 16.5 21.0001C15.6716 21.0001 15 20.3285 15 19.5001C15 18.6716 15.6716 18.0001 16.5 18.0001Z" stroke="currentColor" stroke-width="1.5"/>
                                    </svg>
                                    Quick Add
                                </button> --}}
                            </div>
                        </div>
                    </a>
                @empty
                    <div class="col-span-full text-center py-12">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <h3 class="mt-2 text-sm font-medium text-gray-900">No deals available</h3>
                        <p class="mt-1 text-sm text-gray-500">Check back later for amazing deals!</p>
                    </div>
                @endforelse
            </div>
        </div>
    </section>

    <!-- Products Section with Livewire -->
    <section class="py-16 bg-gray-50" id="products">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between mb-8">
                <h2 class="text-3xl font-bold text-gray-900">Featured Products</h2>
            </div>

            <!-- Livewire Product Grid Component -->
            @include('react.product-grid')
        </div>


    <script>
        function countdown() {
            return {
                timeLeft: '23:45:12',
                init() {
                    // Simple countdown timer
                    setInterval(() => {
                        // This would be calculated based on actual end time
                        // For demo purposes, keeping it static
                    }, 1000);
                }
            }
        }


    </script>
</x-layout>
