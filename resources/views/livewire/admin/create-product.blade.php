<div class="max-w-7xl mx-auto px-2 sm:px-4">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Create New Product</h1>
                <p class="mt-1 text-sm text-gray-600">Add a new product to your inventory or create a deal</p>
            </div>
            <button wire:click="cancel"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                ← Back to Products
            </button>
        </div>
    </div>

    <!-- Flash Messages -->
    @if (session()->has('message'))
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6" role="alert">
            <span class="block sm:inline">{{ session('message') }}</span>
        </div>
    @endif

    @if (session()->has('error'))
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
            <span class="block sm:inline">{{ session('error') }}</span>
        </div>
    @endif

    <!-- Create Form - 2 Column Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column - Form -->
        <div class="bg-white rounded-lg shadow-sm">
            <form wire:submit.prevent="createProduct" class="p-6">
                <div class="space-y-6">
                <!-- Product Name -->
                <div>
                    <label for="product_name" class="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                    </label>
                    <input type="text"
                           id="product_name"
                           wire:model="product_name"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('product_name') border-red-500 @enderror"
                           placeholder="Enter product name">
                    @error('product_name')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Price and Category Row -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Price -->
                    <div>
                        <label for="price" class="block text-sm font-medium text-gray-700 mb-2">
                            Price (₦) *
                        </label>
                        <input type="number"
                               id="price"
                               wire:model="price"
                               step="0.01"
                               min="0"
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('price') border-red-500 @enderror"
                               placeholder="0.00">
                        @error('price')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- Category -->
                    <div>
                        <label for="category_id" class="block text-sm font-medium text-gray-700 mb-2">
                            Category *
                        </label>
                        <select id="category_id"
                                wire:model="category_id"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('category_id') border-red-500 @enderror">
                            <option value="">Select a category</option>
                            @foreach($categories as $category)
                                <option value="{{ $category->id }}">{{ $category->name }}</option>
                            @endforeach
                        </select>
                        @error('category_id')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                <!-- Deal Toggle -->
                <div>
                    <label class="inline-flex items-center">
                        <input type="checkbox"
                               wire:model.live="is_deal"
                               class="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500">
                        <span class="ml-2 text-sm font-medium text-gray-700">This is a deal</span>
                    </label>
                    <p class="mt-1 text-xs text-gray-500">Check this if you want to create a deal with original and discounted prices</p>
                </div>

                <!-- Deal Pricing (Conditional) -->
                @if($is_deal)
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 class="text-sm font-medium text-orange-800 mb-4">Deal Pricing</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Original Price -->
                        <div>
                            <label for="old_price" class="block text-sm font-medium text-orange-700 mb-2">
                                Original Price (₦) *
                            </label>
                            <input type="number"
                                   id="old_price"
                                   wire:model="old_price"
                                   step="0.01"
                                   min="0"
                                   class="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 @error('old_price') border-red-500 @enderror"
                                   placeholder="0.00">
                            @error('old_price')
                                <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- New Price -->
                        <div>
                            <label for="new_price" class="block text-sm font-medium text-orange-700 mb-2">
                                Deal Price (₦) *
                            </label>
                            <input type="number"
                                   id="new_price"
                                   wire:model="new_price"
                                   step="0.01"
                                   min="0"
                                   class="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 @error('new_price') border-red-500 @enderror"
                                   placeholder="0.00">
                            @error('new_price')
                                <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>
                    </div>
                    <p class="mt-2 text-xs text-orange-600">
                        When this is a deal, the regular price will be ignored and deal pricing will be used instead.
                    </p>
                </div>
                @endif

                <!-- Overview -->
                <div>
                    <label for="overview" class="block text-sm font-medium text-gray-700 mb-2">
                        Overview
                    </label>
                    <textarea id="overview"
                              wire:model="overview"
                              rows="3"
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('overview') border-red-500 @enderror"
                              placeholder="Brief overview of the product"></textarea>
                    @error('overview')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Description -->
                <div>
                    <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                    </label>
                    <textarea id="description"
                              wire:model="description"
                              rows="4"
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('description') border-red-500 @enderror"
                              placeholder="Detailed product description"></textarea>
                    @error('description')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- About -->
                <div>
                    <label for="about" class="block text-sm font-medium text-gray-700 mb-2">
                        About
                    </label>
                    <textarea id="about"
                              wire:model="about"
                              rows="3"
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="About this product"></textarea>
                    <p class="mt-1 text-xs text-gray-500">Additional information about the product</p>
                </div>

                <!-- Stock Status -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Stock Status
                    </label>
                    <div class="space-y-2">
                        <label class="inline-flex items-center">
                            <input type="checkbox" wire:model="in_stock" class="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500">
                            <span class="ml-2 text-sm text-gray-700">In Stock</span>
                        </label>
                        <label class="inline-flex items-center">
                            <input type="checkbox" wire:model="out_of_stock" class="rounded border-gray-300 text-red-600 shadow-sm focus:ring-red-500">
                            <span class="ml-2 text-sm text-gray-700">Out of Stock</span>
                        </label>
                    </div>
                </div>

                <!-- Product Status -->
                <div>
                    <label for="product_status" class="block text-sm font-medium text-gray-700 mb-2">
                        Product Status *
                    </label>
                    <select id="product_status"
                            wire:model="product_status"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('product_status') border-red-500 @enderror">
                        <option value="new">New</option>
                        <option value="uk_used">UK Used</option>
                        <option value="refurbished">Refurbished</option>
                    </select>
                    @error('product_status')
                        <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                    <p class="mt-1 text-xs text-gray-500">Select the condition of the product</p>
                </div>

                <!-- Product Images Upload -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Product Images (Up to 3 images)</label>

                    <!-- File Upload Input -->
                    <div class="mb-4">
                        <input type="file"
                               wire:model="product_images"
                               accept=".jpg,.jpeg,image/jpeg"
                               class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                               {{ count($product_images) >= 3 ? 'disabled' : '' }}>
                        @error('product_images')
                            <span class="text-red-500 text-sm">{{ $message }}</span>
                        @enderror
                        @error('product_images.*')
                            <span class="text-red-500 text-sm">{{ $message }}</span>
                        @enderror
                        <p class="text-xs text-gray-500 mt-1">
                            {{ count($product_images) }}/3 images selected.
                            {{ count($product_images) >= 3 ? 'Maximum reached' : 'Select one image at a time to add to your collection' }}
                        </p>
                    </div>

                    <!-- Loading indicator -->
                    <div wire:loading wire:target="product_images" class="text-blue-500 text-sm mb-2">
                        Processing image...
                    </div>

                    <!-- Debug info (remove in production) -->
                    <div class="text-xs text-gray-400 mb-2">
                        Debug: product_images count: {{ count($product_images) }}
                    </div>

                    <!-- Preview uploaded images -->
                    @if(count($product_images) > 0)
                        <div class="flex flex-wrap gap-3 mb-4">
                            @foreach($product_images as $index => $image)
                                <div class="relative">
                                    <img src="{{ $image->temporaryUrl() }}"
                                         alt="Preview"
                                         class="w-20 h-20 object-cover rounded-lg border border-gray-200">
                                    <button type="button"
                                            wire:click="removeImage({{ $index }})"
                                            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm">
                                        ×
                                    </button>
                                </div>
                            @endforeach
                        </div>
                    @else
                        <div class="text-xs text-gray-400 mb-2">No images selected yet</div>
                    @endif

                    <p class="text-sm text-gray-500">
                        • Maximum 3 images per product<br>
                        • Only JPG/JPEG files allowed<br>
                        • Maximum file size: 2MB per image<br>
                        • Minimum dimensions: 100x100px<br>
                        • Maximum dimensions: 4000x4000px
                    </p>
                </div>

                <!-- Images URLs -->
                <div>
                    <label for="images_url" class="block text-sm font-medium text-gray-700 mb-2">
                        Or Enter Image URLs Manually
                    </label>
                    <textarea id="images_url"
                              wire:model="images_url"
                              rows="3"
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter image URLs (one per line)&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg"></textarea>
                    <p class="mt-1 text-xs text-gray-500">Enter one image URL per line</p>
                </div>

                <!-- Colors -->
                <div>
                    <label for="colors" class="block text-sm font-medium text-gray-700 mb-2">
                        Available Colors
                    </label>
                    <input type="text"
                           id="colors"
                           wire:model="colors"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Red, Blue, Green, Black">
                    <p class="mt-1 text-xs text-gray-500">Enter colors separated by commas</p>
                </div>

                <!-- Storage Options -->
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <label class="block text-sm font-medium text-gray-700">
                            Storage Options
                        </label>
                        <label class="inline-flex items-center">
                            <input type="checkbox"
                                   wire:model.live="has_storage"
                                   class="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500">
                            <span class="ml-2 text-sm text-gray-700">Product has storage variants</span>
                        </label>
                    </div>

                    @if($has_storage)
                        <div class="space-y-3 p-4 bg-gray-50 rounded-lg">
                            @forelse($storage_options as $index => $option)
                                <div class="flex gap-3 items-start">
                                    <div class="flex-1">
                                        <input type="text"
                                               wire:model="storage_options.{{ $index }}.storage"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('storage_options.' . $index . '.storage') border-red-500 @enderror"
                                               placeholder="e.g., 128GB, 256GB, 512GB">
                                        @error('storage_options.' . $index . '.storage')
                                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                        @enderror
                                    </div>
                                    <div class="flex-1">
                                        <div class="relative">
                                            <span class="absolute left-3 top-2 text-gray-500">₦</span>
                                            <input type="number"
                                                   wire:model="storage_options.{{ $index }}.price"
                                                   step="0.01"
                                                   min="0"
                                                   class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 @error('storage_options.' . $index . '.price') border-red-500 @enderror"
                                                   placeholder="0.00">
                                        </div>
                                        @error('storage_options.' . $index . '.price')
                                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                                        @enderror
                                    </div>
                                    <button type="button"
                                            wire:click="removeStorageOption({{ $index }})"
                                            class="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                            @if(count($storage_options) <= 1) disabled @endif>
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            @empty
                                <p class="text-sm text-gray-500 text-center py-4">No storage options added yet</p>
                            @endforelse

                            <button type="button"
                                    wire:click="addStorageOption"
                                    class="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                                <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                Add Storage Option
                            </button>
                        </div>
                        <p class="mt-1 text-xs text-gray-500">Define different storage capacities with their prices. Leave empty if product doesn't have storage variants.</p>
                    @endif
                </div>

                <!-- What's Included -->
                <div>
                    <label for="what_is_included" class="block text-sm font-medium text-gray-700 mb-2">
                        What's Included
                    </label>
                    <textarea id="what_is_included"
                              wire:model="what_is_included"
                              rows="4"
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter items included (one per line)&#10;Product&#10;Charger&#10;User Manual&#10;Warranty Card"></textarea>
                    <p class="mt-1 text-xs text-gray-500">Enter one item per line</p>
                </div>

                <!-- Specifications -->
                <div>
                    <label for="specification" class="block text-sm font-medium text-gray-700 mb-2">
                        Specifications
                    </label>
                    <textarea id="specification"
                              wire:model="specification"
                              rows="4"
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter specifications (one per line)&#10;Weight: 1.5kg&#10;Dimensions: 20cm x 15cm x 10cm&#10;Material: Premium plastic"></textarea>
                    <p class="mt-1 text-xs text-gray-500">Enter one specification per line</p>
                </div>
            </div>

            <!-- Form Actions -->
            <div class="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                <button type="button"
                        wire:click="cancel"
                        class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    Cancel
                </button>
                <button type="submit"
                        class="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    Create Product
                </button>
            </div>
        </form>
        </div>

        <!-- Right Column - Sample Data Preview -->
        <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="sticky top-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Sample Product Data</h3>
                <p class="text-sm text-gray-600 mb-6">Use this as a reference for filling out the form</p>

                <!-- Sample Product Card -->
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                    <!-- Product Image -->
                    <div class="h-48 bg-gray-100 flex items-center justify-center">
                        <img src="https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=200&fit=crop"
                             alt="Sample Product"
                             class="h-full w-full object-cover">
                    </div>

                    <!-- Product Details -->
                    <div class="p-4 space-y-3">
                        <div class="flex items-center justify-between">
                            <h4 class="font-semibold text-gray-900">iPhone 15 Pro Max</h4>
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>
                        </div>

                        <p class="text-2xl font-bold text-blue-600">₦1,599,000</p>

                        <p class="text-sm text-gray-600 line-clamp-2">The latest flagship smartphone with advanced camera system, A17 Pro chip, and titanium design.</p>

                        <div class="flex flex-wrap gap-1">
                            <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Natural Titanium</span>
                            <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Blue Titanium</span>
                            <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">White Titanium</span>
                        </div>
                    </div>
                </div>

                <!-- Sample Data Fields -->
                <div class="mt-6 space-y-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 mb-3">Sample Field Data:</h4>

                        <div class="space-y-2 text-sm">
                            <div><strong>Product Name:</strong> iPhone 15 Pro Max</div>
                            <div><strong>Price:</strong> 1599000</div>
                            <div><strong>Overview:</strong> Latest flagship smartphone with premium features</div>
                            <div><strong>Description:</strong> The iPhone 15 Pro Max features the most advanced camera system, A17 Pro chip, and durable titanium design for professional photography and gaming.</div>
                            <div><strong>Product Status:</strong> new</div>
                            <div><strong>Colors:</strong> Natural Titanium, Blue Titanium, White Titanium, Black Titanium</div>
                            <div><strong>What's Included:</strong>
                                <br>• iPhone 15 Pro Max
                                <br>• USB-C to USB-C Cable
                                <br>• Documentation
                            </div>
                            <div><strong>Specifications:</strong>
                                <br>• Display: 6.7-inch Super Retina XDR
                                <br>• Chip: A17 Pro
                                <br>• Storage: 256GB, 512GB, 1TB
                                <br>• Camera: 48MP Main, 12MP Ultra Wide
                                <br>• Battery: Up to 29 hours video playback
                            </div>
                            <div><strong>Images (URLs):</strong>
                                <br>https://images.unsplash.com/photo-1583394838336-acd977736f90
                                <br>https://images.unsplash.com/photo-1592899677977-9c10ca588bbd
                            </div>
                        </div>
                    </div>

                    <!-- Tips Section -->
                    <div class="bg-blue-50 rounded-lg p-4">
                        <h4 class="font-medium text-blue-900 mb-2">💡 Pro Tips:</h4>
                        <ul class="text-sm text-blue-800 space-y-1">
                            <li>• Use high-quality product images (recommended: 800x800px)</li>
                            <li>• Write detailed descriptions for better SEO</li>
                            <li>• Include specifications customers commonly search for</li>
                            <li>• Use comma-separated values for colors</li>
                            <li>• Enter one item per line for "What's Included"</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
