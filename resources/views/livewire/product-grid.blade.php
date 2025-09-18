<div>
    <!-- Filters Section -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <!-- Left Filters -->
            <div class="flex flex-wrap items-center gap-4">
                <!-- Category Filter -->
                <div class="min-w-0">
                    <select wire:model.live="selectedCategory" class="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="">All Categories</option>
                        @foreach($categories as $category)
                            <option value="{{ $category->id }}">{{ $category->name }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Price Range -->
                <div class="flex items-center gap-2">
                    <input
                        type="number"
                        wire:model.live.debounce.500ms="minPrice"
                        placeholder="Min Price"
                        class="w-24 rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                    <span class="text-gray-500">-</span>
                    <input
                        type="number"
                        wire:model.live.debounce.500ms="maxPrice"
                        placeholder="Max Price"
                        class="w-24 rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                </div>

                <!-- Status Filter -->
                <div class="min-w-0">
                    <select wire:model.live="productStatus" class="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="">All Conditions</option>
                        <option value="new">New</option>
                        <option value="uk_used">UK Used</option>
                        <option value="refurbished">Refurbished</option>
                    </select>
                </div>

                <!-- Clear Filters -->
                @if($selectedCategory || $minPrice || $maxPrice || $productStatus !== '')
                    <button
                        wire:click="clearFilters"
                        class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        Clear Filters
                    </button>
                @endif
            </div>

            <!-- Right Controls -->
            <div class="flex items-center gap-4">
                <!-- Sort Options -->
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-600">Sort by:</span>
                    <select wire:model.live="sortBy" class="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="created_at">Newest</option>
                        <option value="product_name">Name</option>
                        <option value="price">Price</option>
                    </select>
                    <button
                        wire:click="sortBy('{{ $sortBy }}')"
                        class="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <svg class="w-4 h-4 transform {{ $sortDirection === 'desc' ? 'rotate-180' : '' }}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                        </svg>
                    </button>
                </div>

                <!-- Items per page -->
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-600">Show:</span>
                    <select wire:model.live="perPage" class="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="12">12</option>
                        <option value="24">24</option>
                        <option value="48">48</option>
                    </select>
                </div>
            </div>
        </div>
    </div>

    <!-- Results Info -->
    <div class="flex items-center justify-between mb-6">
        <div class="text-sm text-gray-600">
            Showing {{ $displayedCount }} of {{ $totalCount }} products
        </div>
        @if($displayedCount < $totalCount)
            <div class="text-sm text-blue-600">
                Scroll down to load more
            </div>
        @endif
    </div>

    <!-- Product Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-3 mb-8"
         x-data="infiniteScroll()"
         x-init="init()">
        @foreach($products as $product)
                <div class="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 ease-out group hover:-translate-y-1">
                <a href="{{ route('product.show', $product['id']) }}" class="block">
                <!-- Product Image -->
                <div class="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-xl relative overflow-hidden">
                    @if(isset($product['images_url']) && is_array($product['images_url']) && count($product['images_url']) > 0)
                        <img
                            src="{{ $product['images_url'][0] }}"
                            alt="{{ $product['product_name'] }}"
                            class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                        >
                        <!-- Fallback SVG (hidden by default, shown if image fails to load) -->
                        <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100" style="display: none;">
                            <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                    @else
                        <!-- Default placeholder when no image is available -->
                        <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                    @endif

                    <!-- Status Badge -->
                    @php
                        $status = isset($product['product_status']) ? $product['product_status'] : 'new';

                        if ($status === 'new') {
                            $statusClass = 'bg-green-100 text-green-800';
                            $displayStatus = 'New';
                        } elseif ($status === 'uk_used') {
                            $statusClass = 'bg-yellow-100 text-yellow-800';
                            $displayStatus = 'UK Used';
                        } elseif ($status === 'refurbished') {
                            $statusClass = 'bg-blue-100 text-blue-800';
                            $displayStatus = 'Refurbished';
                        } else {
                            $statusClass = 'bg-gray-100 text-gray-800';
                            $displayStatus = ucfirst($status);
                        }
                    @endphp
                    <div class="absolute top-3 left-3 lg:top-2 lg:left-2 {{ $statusClass }} px-2 py-1 lg:px-1.5 lg:py-0.5 rounded-lg text-xs lg:text-[10px] font-semibold backdrop-blur-sm bg-opacity-95 shadow-sm">
                        {{ $displayStatus }}
                    </div>

                    <!-- Quick Actions -->
                    <div class="absolute top-3 right-3 lg:top-2 lg:right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform translate-y-1 group-hover:translate-y-0">
                        <div class="flex flex-col gap-2 lg:gap-1">
                            <!-- Wishlist / Favorite (non-cart) -->
                            <button onclick="event.stopPropagation(); event.preventDefault();" class="w-9 h-9 lg:w-7 lg:h-7 bg-white/95 backdrop-blur-md rounded-xl lg:rounded-lg flex items-center justify-center hover:bg-white hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ring-1 ring-black/5" title="Wishlist">
                                <svg class="w-4 h-4 lg:w-3 lg:h-3 text-gray-600 hover:text-red-500 transition-colors duration-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <!-- Add to Cart quick action -->
                            <button
                                x-data
                                @click="event.stopPropagation(); event.preventDefault();
                                    // Use React cart store instead of Alpine
                                    if (window.useCartStore && window.useCartStore.getState) {
                                        window.useCartStore.getState().addToCart('{{ $product['id'] }}', 1, 'product');
                                    } else {
                                        $wire.addToCart('{{ $product['id'] }}');
                                    }"
                                class="w-9 h-9 lg:w-7 lg:h-7 bg-blue-500/95 backdrop-blur-md rounded-xl lg:rounded-lg flex items-center justify-center hover:bg-blue-600 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ring-1 ring-blue-400/20 text-white"
                                title="Add to Cart">
                                <svg class="w-4 h-4 lg:w-3 lg:h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 3L2.26491 3.0883C3.58495 3.52832 4.24497 3.74832 4.62248 4.2721C5 4.79587 5 5.49159 5 6.88304V9.5C5 12.7875 5 14.4312 5.90796 15.5376C6.07418 15.7401 6.25989 15.9258 6.46243 16.092C7.56878 17 9.21252 17 12.5 17C15.7875 17 17.4312 17 18.5376 16.092C18.7401 15.9258 18.9258 15.7401 19.092 15.5376C20 14.4312 20 12.7875 20 9.5V8.5C20 7.09554 20 6.39331 19.6532 5.88886C19.3065 5.38441 18.6851 5.18885 17.4422 4.79773L12.5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                    <path d="M7.5 18C8.32843 18 9 18.6716 9 19.5C9 20.3284 8.32843 21 7.5 21C6.67157 21 6 20.3284 6 19.5C6 18.6716 6.67157 18 7.5 18Z" stroke="currentColor" stroke-width="1.5"/>
                                    <path d="M16.5 18.0001C17.3284 18.0001 18 18.6716 18 19.5001C18 20.3285 17.3284 21.0001 16.5 21.0001C15.6716 21.0001 15 20.3285 15 19.5001C15 18.6716 15.6716 18.0001 16.5 18.0001Z" stroke="currentColor" stroke-width="1.5"/>
                                </svg>
                            </button>
                            <!-- View Product quick action -->
                            <button onclick="event.stopPropagation(); window.location.href='{{ route('product.show', $product['id']) }}';" class="w-9 h-9 lg:w-7 lg:h-7 bg-white/95 backdrop-blur-md rounded-xl lg:rounded-lg flex items-center justify-center hover:bg-white hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ring-1 ring-black/5" title="View product">
                                <svg class="w-4 h-4 lg:w-3 lg:h-3 text-gray-600 hover:text-blue-600 transition-colors duration-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Product Info -->
                <div class="p-4 sm:p-5 lg:p-3 xl:p-3">
                    <!-- Category -->
                    @if(isset($product['category']) && $product['category'])
                        <div class="text-xs text-blue-600 font-semibold mb-2 lg:mb-1 tracking-wide uppercase">
                            {{ $product['category']['name'] }}
                        </div>
                    @endif

                    <!-- Product Name -->
                    <h3 class="font-bold text-gray-900 text-sm sm:text-base lg:text-sm xl:text-sm mb-2 lg:mb-1 line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors duration-200">
                        {{ $product['product_name'] }}
                    </h3>

                    <!-- Description -->
                    @if(isset($product['overview']) && $product['overview'])
                        <p class="text-xs sm:text-sm lg:text-xs text-gray-500 mb-3 sm:mb-4 lg:mb-2 line-clamp-1 sm:line-clamp-2 lg:line-clamp-1 leading-relaxed">
                            {{ $product['overview'] }}
                        </p>
                    @endif

                    <!-- Price -->
                    <div class="flex items-center justify-between">
                        <div class="text-sm sm:text-lg lg:text-sm xl:text-sm font-bold text-gray-900">
                            <span class="text-blue-600">₦{{ number_format($product['display_price'], 2) }}</span>
                            @if(!empty($product['default_storage']))
                                <span class="text-xs lg:text-[10px] text-gray-400 block font-normal">{{ $product['default_storage'] }}</span>
                            @endif
                        </div>

                        @if($product['in_stock'])
                            <button onclick="event.stopPropagation(); window.location.href='{{ route('product.show', $product['id']) }}';" class="w-9 h-9 lg:w-7 lg:h-7 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-xl lg:rounded-lg hidden sm:flex items-center justify-center hover:from-blue-100 hover:to-indigo-100 hover:scale-105 transition-all duration-200 group/btn shadow-sm hover:shadow-md ring-1 ring-blue-100" title="View product">
                                <svg class="w-4 h-4 lg:w-3 lg:h-3 group-hover/btn:scale-110 transition-transform duration-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 3L2.26491 3.0883C3.58495 3.52832 4.24497 3.74832 4.62248 4.2721C5 4.79587 5 5.49159 5 6.88304V9.5C5 12.7875 5 14.4312 5.90796 15.5376C6.07418 15.7401 6.25989 15.9258 6.46243 16.092C7.56878 17 9.21252 17 12.5 17C15.7875 17 17.4312 17 18.5376 16.092C18.7401 15.9258 18.9258 15.7401 19.092 15.5376C20 14.4312 20 12.7875 20 9.5V8.5C20 7.09554 20 6.39331 19.6532 5.88886C19.3065 5.38441 18.6851 5.18885 17.4422 4.79773L12.5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                    <path d="M7.5 18C8.32843 18 9 18.6716 9 19.5C9 20.3284 8.32843 21 7.5 21C6.67157 21 6 20.3284 6 19.5C6 18.6716 6.67157 18 7.5 18Z" stroke="currentColor" stroke-width="1.5"/>
                                    <path d="M16.5 18.0001C17.3284 18.0001 18 18.6716 18 19.5001C18 20.3285 17.3284 21.0001 16.5 21.0001C15.6716 21.0001 15 20.3285 15 19.5001C15 18.6716 15.6716 18.0001 16.5 18.0001Z" stroke="currentColor" stroke-width="1.5"/>
                                </svg>
                            </button>
                        @else
                            <button onclick="event.stopPropagation(); window.location.href='{{ route('product.show', $product['id']) }}';" class="w-9 h-9 lg:w-7 lg:h-7 bg-gray-50 text-gray-400 rounded-xl lg:rounded-lg flex items-center justify-center hover:bg-gray-100 hover:scale-105 transition-all duration-200 group/btn shadow-sm hover:shadow-md ring-1 ring-gray-100" title="View product">
                                <svg class="w-4 h-4 lg:w-3 lg:h-3 group-hover/btn:scale-110 transition-transform duration-200" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="1.5"/>
                                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="1.5"/>
                                </svg>
                            </button>
                        @endif
                    </div>
                </div>
                </a>
            </div>
        @endforeach
    </div>

    <!-- Load More Button -->
    @if($hasMore && count($products) > 0)
        <div class="mt-8 text-center">
            <button
                wire:click="loadMore"
                class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium space-x-2"
                aria-label="Load more products"
                wire:loading.attr="disabled"
                wire:loading.class="opacity-50 cursor-not-allowed"
            >
                <!-- Icon + Text -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span wire:loading.remove>Load more</span>

                <!-- Loading state inside button -->
                <span wire:loading class="inline-flex items-center space-x-2">
                    <svg class="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Loading...</span>
                </span>
            </button>
        </div>
    @endif

    <!-- Loading Spinner for Infinite Scroll -->
    <div x-show="(typeof loading !== 'undefined') && loading" class="mt-8 text-center py-8" style="display: none;">
        <div class="inline-flex items-center">
            <svg class="animate-spin h-6 w-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading more products...
        </div>
    </div>

    <!-- Empty State -->
    @if(empty($products))
        <div class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p class="text-gray-500 mb-4">Try adjusting your search criteria or filters.</p>
            <button
                wire:click="clearFilters"
                class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
                Clear All Filters
            </button>
        </div>
    @endif

    <!-- Infinite Scroll Script -->
    <script>
        function infiniteScroll() {
            return {
                loading: false,

                init() {
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting && @this.hasMore && !this.loading) {
                                this.loadMore();
                            }
                        });
                    }, {
                        rootMargin: '100px'
                    });

                    // Observe the last product card
                    this.$nextTick(() => {
                        const lastCard = this.$el.lastElementChild;
                        if (lastCard) {
                            observer.observe(lastCard);
                        }
                    });

                    // Re-observe when new products are loaded
                    Livewire.hook('message.processed', () => {
                        observer.disconnect();
                        this.$nextTick(() => {
                            const lastCard = this.$el.lastElementChild;
                            if (lastCard) {
                                observer.observe(lastCard);
                            }
                        });
                    });
                },

                loadMore() {
                    if (@this.hasMore && !this.loading) {
                        this.loading = true;
                        @this.call('loadMore').then(() => {
                            this.loading = false;
                        });
                    }
                }
            }
        }
    </script>
</div>
