import React, { useEffect, useState } from 'react';
import useProductStore from '../stores/productStore';
import useCartStore from '../stores/cartStore';

const ProductGrid = ({ initialSearchQuery = '', initialCategoryId = '' }) => {
  console.log('ProductGrid component initialized with props:', { initialSearchQuery, initialCategoryId });
  
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

  console.log('ProductGrid state:', { products: products.length, totalProducts, isLoading });

  const { addToCart, isLoading: cartLoading } = useCartStore();

  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        console.log('Categories API response:', data);
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

  const handleSortChange = (sortField) => {
    const newDirection = sortBy === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortBy(sortField, newDirection);
  };

  const handleAddToCart = async (productId) => {
    await addToCart(productId, 1, 'product');
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

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div>
      {/* Debug Info */}
      <div style={{padding: '10px', backgroundColor: '#f0f0f0', fontSize: '12px'}}>
        Debug: Products Count: {products.length}, Loading: {isLoading ? 'Yes' : 'No'}, 
        Total: {totalProducts}, Categories: {categories.length}
      </div>

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

      {/* Products Grid */}
      {isLoading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  {product.images_url && product.images_url.length > 0 ? (
                    <img
                      src={product.images_url[0]}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.product_name}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ₦{product.price.toLocaleString()}
                  </p>
                  
                  {/* Stock Badge */}
                  <div className="mt-2">
                    {product.in_stock ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={!product.in_stock || cartLoading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {cartLoading ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <a
                    href={`/product/${product.id}`}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Loading...' : 'Load More Products'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <svg className="mx-auto h-24 w-24 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No products found</h2>
          <p className="text-gray-600 mb-4">Try adjusting your filters or search terms.</p>
          <button
            onClick={clearFilters}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;