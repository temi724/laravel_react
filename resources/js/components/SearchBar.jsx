import React, { useState, useRef, useEffect } from 'react';
import useProductStore from '../stores/productStore';

const SearchBar = ({ onSearch, placeholder = "Search for products..." }) => {
  const {
    searchResults,
    showSearchDropdown,
    setSearchQuery,
    hideSearchDropdown,
  } = useProductStore();

  const [query, setQuery] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchRef = useRef(null);
  const timeoutRef = useRef(null);

  // Helper function to generate SEO-friendly product URL
  const generateProductUrl = (product) => {
    const slug = product.product_name?.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
      .trim();
    return `/product/${product.id}/${slug}`;
  };

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        hideSearchDropdown();
        setIsInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hideSearchDropdown]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the search
    timeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    if (query.length >= 2) {
      setSearchQuery(query);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query);
      hideSearchDropdown();
      setIsInputFocused(false);

      // Navigate to search results if onSearch callback is provided
      if (onSearch) {
        onSearch(query);
      } else {
        // Default navigation to search page
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
      }
    }
  };

  const handleResultClick = (product) => {
    hideSearchDropdown();
    setIsInputFocused(false);
    window.location.href = generateProductUrl(product);
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearchQuery('');
                hideSearchDropdown();
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg
                className="h-4 w-4 text-gray-400 hover:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Search Dropdown */}
      {showSearchDropdown && isInputFocused && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="py-2">
            {searchResults.map((product) => (
              <button
                key={product.id}
                onClick={() => handleResultClick(product)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
              >
                {/* Product Image */}
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {product.images_url && product.images_url.length > 0 ? (
                    <img
                      src={product.images_url[0]}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {highlightMatch(product.product_name, query)}
                  </h4>
                  <p className="text-sm text-blue-600 font-semibold">
                    ₦{product.price.toLocaleString()}
                  </p>
                  {!product.in_stock && (
                    <span className="text-xs text-red-500">Out of stock</span>
                  )}
                </div>

                {/* Arrow Icon */}
                <div className="text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* View All Results */}
          <div className="border-t border-gray-200 px-4 py-3">
            <button
              onClick={() => {
                handleSubmit({ preventDefault: () => {} });
              }}
              className="w-full text-left text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all results for "{query}" →
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {showSearchDropdown && isInputFocused && query.length >= 2 && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="px-4 py-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 text-sm">
              No products found for "{query}"
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Try a different search term
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
