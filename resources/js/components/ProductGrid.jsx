import React, { useEffect, useState } from 'react';
import useProductStore from '../stores/productStore';
import useCartStore from '../stores/cartStore';

const ProductGrid = ({ initialSearchQuery = '', initialCategoryId = '' }) => {
  const {
    products,
    totalProducts,
    currentPage,
    hasMore,
    isLoading,
    sortBy,
    sortDirection,
    selectedCategory,
    minPrice,
    maxPrice,
    productStatus,
    searchQuery,
    perPage,
    setFilters,
    setSortBy,
    setPerPage,
    loadMore,
    initialize,
  } = useProductStore();

  const { addToCart, isLoading: cartLoading } = useCartStore();

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Load categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        // Categories API returns array directly
        setCategories(data);
      })
      .catch(console.error);

    // Initialize store with URL parameters
    initialize({
      searchQuery: initialSearchQuery,
      categoryId: initialCategoryId,
    });
  }, [initialize, initialSearchQuery, initialCategoryId]);

  const handleFilterChange = (filterType, value) => {
    setFilters({ [filterType]: value });
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1, 'product', null, null, null, product);

      // Track checkout event for analytics
      if (window.trackCheckoutEvent) {
        window.trackCheckoutEvent('cart_add', {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          value: product.price
        });
      }
    } catch (error) {
      console.error('ProductGrid addToCart failed:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      selectedCategory: '',
      minPrice: '',
      maxPrice: '',
      productStatus: '',
      searchQuery: '',
    });
  };

  return (
    <div>
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <div className="min-w-0">
              <select
                value={selectedCategory}
                onChange={(e) => handleFilterChange('selectedCategory', e.target.value)}
                className="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="Min Price"
                className="w-24 rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="Max Price"
                className="w-24 rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="min-w-0">
              <select
                value={productStatus}
                onChange={(e) => handleFilterChange('productStatus', e.target.value)}
                className="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Conditions</option>
                <option value="new">New</option>
                <option value="uk_used">UK Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(selectedCategory || minPrice || maxPrice || productStatus !== '') && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value, sortDirection)}
                className="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="created_at">Newest</option>
                <option value="product_name">Name</option>
                <option value="price">Price</option>
              </select>
              <button
                onClick={() => setSortBy(sortBy, sortDirection === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className={`w-4 h-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                </svg>
              </button>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(parseInt(e.target.value))}
                className="rounded-lg border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          Showing {products.length} of {totalProducts} products
        </div>
        {hasMore && (
          <div className="text-sm text-blue-600">
            Scroll down to load more
          </div>
        )}
      </div>

      {/* Product Grid */}
      {isLoading && products.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-3 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-t-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-3 mb-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 ease-out group hover:-translate-y-1">
                <a
                  href={`/product/${product.id}`}
                  className="block"
                  onClick={() => {
                    if (window.trackProductView) {
                      window.trackProductView(product.id, product.name);
                    }
                  }}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-xl relative overflow-hidden">
                    {product.images_url && product.images_url.length > 0 ? (
                      <img
                        src={product.images_url[0]}
                        alt={product.product_name}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    {/* Fallback SVG */}
                    <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 ${product.images_url && product.images_url.length > 0 ? 'hidden' : 'flex'}`}>
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>

                    {/* Status Badge */}
                    {(() => {
                      const status = product.product_status || 'new';
                      let statusClass, displayStatus;

                      if (status === 'new') {
                        statusClass = 'bg-green-100 text-green-800';
                        displayStatus = 'New';
                      } else if (status === 'uk_used') {
                        statusClass = 'bg-yellow-100 text-yellow-800';
                        displayStatus = 'UK Used';
                      } else if (status === 'refurbished') {
                        statusClass = 'bg-blue-100 text-blue-800';
                        displayStatus = 'Refurbished';
                      } else {
                        statusClass = 'bg-gray-100 text-gray-800';
                        displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
                      }

                      return (
                        <div className={`absolute top-3 left-3 lg:top-2 lg:left-2 ${statusClass} px-2 py-1 lg:px-1.5 lg:py-0.5 rounded-lg text-xs lg:text-[10px] font-semibold backdrop-blur-sm bg-opacity-95 shadow-sm`}>
                          {displayStatus}
                        </div>
                      );
                    })()}

                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 lg:top-2 lg:right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform translate-y-1 group-hover:translate-y-0">
                      <div className="flex flex-col gap-2 lg:gap-1">
                        {/* Wishlist / Favorite */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          className="w-9 h-9 lg:w-7 lg:h-7 bg-white/95 backdrop-blur-md rounded-xl lg:rounded-lg flex items-center justify-center hover:bg-white hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ring-1 ring-black/5"
                          title="Wishlist"
                        >
                          <svg className="w-4 h-4 lg:w-3 lg:h-3 text-gray-600 hover:text-red-500 transition-colors duration-200" viewBox="0 0 24 24" fill="none">
                            <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>

                        {/* Add to Cart quick action */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleAddToCart(product);
                          }}
                          className="w-9 h-9 lg:w-7 lg:h-7 bg-blue-500/95 backdrop-blur-md rounded-xl lg:rounded-lg flex items-center justify-center hover:bg-blue-600 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ring-1 ring-blue-400/20 text-white"
                          title="Add to Cart"
                        >
                          <svg className="w-4 h-4 lg:w-3 lg:h-3" viewBox="0 0 24 24" fill="none">
                            <path d="M2 3L2.26491 3.0883C3.58495 3.52832 4.24497 3.74832 4.62248 4.2721C5 4.79587 5 5.49159 5 6.88304V9.5C5 12.7875 5 14.4312 5.90796 15.5376C6.07418 15.7401 6.25989 15.9258 6.46243 16.092C7.56878 17 9.21252 17 12.5 17C15.7875 17 17.4312 17 18.5376 16.092C18.7401 15.9258 18.9258 15.7401 19.092 15.5376C20 14.4312 20 12.7875 20 9.5V8.5C20 7.09554 20 6.39331 19.6532 5.88886C19.3065 5.38441 18.6851 5.18885 17.4422 4.79773L12.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M7.5 18C8.32843 18 9 18.6716 9 19.5C9 20.3284 8.32843 21 7.5 21C6.67157 21 6 20.3284 6 19.5C6 18.6716 6.67157 18 7.5 18Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M16.5 18.0001C17.3284 18.0001 18 18.6716 18 19.5001C18 20.3285 17.3284 21.0001 16.5 21.0001C15.6716 21.0001 15 20.3285 15 19.5001C15 18.6716 15.6716 18.0001 16.5 18.0001Z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </button>

                        {/* View Product quick action */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.trackProductView) {
                              window.trackProductView(product.id, product.name);
                            }
                            window.location.href = `/product/${product.id}`;
                          }}
                          className="w-9 h-9 lg:w-7 lg:h-7 bg-white/95 backdrop-blur-md rounded-xl lg:rounded-lg flex items-center justify-center hover:bg-white hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ring-1 ring-black/5"
                          title="View product"
                        >
                          <svg className="w-4 h-4 lg:w-3 lg:h-3 text-gray-600 hover:text-blue-600 transition-colors duration-200" viewBox="0 0 24 24" fill="none">
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5"></path>
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="1.5"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 sm:p-5 lg:p-3 xl:p-3">
                    {/* Category */}
                    {product.category && (
                      <div className="flex items-center space-x-2 mb-2 lg:mb-1">
                        <div className="text-xs text-blue-600 font-semibold tracking-wide uppercase">
                          {product.category.name}
                        </div>
                        {product.type === 'deal' && (
                          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded">
                            DEAL
                          </span>
                        )}
                      </div>
                    )}

                    {/* Product Name */}
                    <div className="flex items-center justify-between mb-2 lg:mb-1">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-sm xl:text-sm line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors duration-200 flex-1">
                        {product.product_name}
                      </h3>
                      {product.type === 'deal' && product.old_price && product.old_price > product.price && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded ml-2 flex-shrink-0">
                          -{Math.round(((product.old_price - product.price) / product.old_price) * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {product.overview && (
                      <p className="text-xs sm:text-sm lg:text-xs text-gray-500 mb-3 sm:mb-4 lg:mb-2 line-clamp-1 sm:line-clamp-2 lg:line-clamp-1 leading-relaxed">
                        {product.overview}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm sm:text-lg lg:text-sm xl:text-sm font-bold text-gray-900">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-600">₦{parseFloat(product.price).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            {product.type === 'deal' && product.old_price && product.old_price > product.price && (
                              <span className="text-xs text-gray-500 line-through">
                                ₦{parseFloat(product.old_price).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                          {product.default_storage && (
                            <span className="text-xs lg:text-[10px] text-gray-400 font-normal">{product.default_storage}</span>
                          )}
                        </div>
                      </div>

                      {product.in_stock ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.trackProductView) {
                              window.trackProductView(product.id, product.name);
                            }
                            window.location.href = `/product/${product.id}`;
                          }}
                          className="w-9 h-9 lg:w-7 lg:h-7 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-xl lg:rounded-lg hidden sm:flex items-center justify-center hover:from-blue-100 hover:to-indigo-100 hover:scale-105 transition-all duration-200 group/btn shadow-sm hover:shadow-md ring-1 ring-blue-100"
                          title="View product"
                        >
                          <svg className="w-4 h-4 lg:w-3 lg:h-3 group-hover/btn:scale-110 transition-transform duration-200" viewBox="0 0 24 24" fill="none">
                            <path d="M2 3L2.26491 3.0883C3.58495 3.52832 4.24497 3.74832 4.62248 4.2721C5 4.79587 5 5.49159 5 6.88304V9.5C5 12.7875 5 14.4312 5.90796 15.5376C6.07418 15.7401 6.25989 15.9258 6.46243 16.092C7.56878 17 9.21252 17 12.5 17C15.7875 17 17.4312 17 18.5376 16.092C18.7401 15.9258 18.9258 15.7401 19.092 15.5376C20 14.4312 20 12.7875 20 9.5V8.5C20 7.09554 20 6.39331 19.6532 5.88886C19.3065 5.38441 18.6851 5.18885 17.4422 4.79773L12.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M7.5 18C8.32843 18 9 18.6716 9 19.5C9 20.3284 8.32843 21 7.5 21C6.67157 21 6 20.3284 6 19.5C6 18.6716 6.67157 18 7.5 18Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M16.5 18.0001C17.3284 18.0001 18 18.6716 18 19.5001C18 20.3285 17.3284 21.0001 16.5 21.0001C15.6716 21.0001 15 20.3285 15 19.5001C15 18.6716 15.6716 18.0001 16.5 18.0001Z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.trackProductView) {
                              window.trackProductView(product.id, product.name);
                            }
                            window.location.href = `/product/${product.id}`;
                          }}
                          className="w-9 h-9 lg:w-7 lg:h-7 bg-gray-50 text-gray-400 rounded-xl lg:rounded-lg flex items-center justify-center hover:bg-gray-100 hover:scale-105 transition-all duration-200 group/btn shadow-sm hover:shadow-md ring-1 ring-gray-100"
                          title="View product"
                        >
                          <svg className="w-4 h-4 lg:w-3 lg:h-3 group-hover/btn:scale-110 transition-transform duration-200" viewBox="0 0 24 24" fill="none">
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Load more products"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span>{isLoading ? 'Loading...' : 'Load more'}</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters.</p>
          <button
            onClick={clearFilters}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
