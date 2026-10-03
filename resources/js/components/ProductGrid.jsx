import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown2, BoxSearch, Refresh, Setting4 } from 'iconsax-react';
import useProductStore from '../stores/productStore';
import ProductCard, { ProductCardSkeleton } from './ProductCard';

const GRID = 'grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';

const CONDITIONS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'uk_used', label: 'UK used' },
  { value: 'refurbished', label: 'Refurbished' },
];

const SORTS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'price:asc', label: 'Price: low to high' },
  { value: 'price:desc', label: 'Price: high to low' },
  { value: 'product_name:asc', label: 'Name: A to Z' },
];

const parse = (json) => {
  try {
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('ProductGrid could not read what the page sent:', error);
    return null;
  }
};

// Props arrive from data-prop-* attributes, which the browser lowercases.
//   initialproducts    the first page of products, already printed in the HTML by the server
//   initialcategories  the categories for the chips
//   pagebase           the page's path; "Load more" is then a real link to its next page
const ProductGrid = ({ initialsearchquery = '', initialcategoryid = '', initialproducts = '', initialcategories = '', pagebase = '' }) => {
  // Before the store is read: the grid's first render already shows the server's products,
  // so nothing is fetched again and nothing on the page moves when the grid takes over.
  const [seededAtStart] = useState(() => {
    const listing = parse(initialproducts);
    if (!listing || !Array.isArray(listing.data)) return false;
    useProductStore.getState().seed(listing, { categoryId: initialcategoryid });
    return true;
  });

  const {
    seeded,
    currentPage,
    products,
    totalProducts,
    hasMore,
    isLoading,
    loadError,
    sortBy,
    sortDirection,
    selectedCategory,
    minPrice,
    maxPrice,
    productStatus,
    searchQuery,
    setFilters,
    setSortBy,
    loadMore,
    loadProducts,
    initialize,
  } = useProductStore();

  const [categories, setCategories] = useState(() => {
    const sent = parse(initialcategories);
    return Array.isArray(sent) ? sent : [];
  });
  // False until the first request has been sent: an unseeded grid has nothing to show yet,
  // which is not the same as a search that found nothing
  const [started, setStarted] = useState(seededAtStart);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const sentinelRef = useRef(null);

  useEffect(() => {
    // The page normally sends the categories; ask for them only when it did not
    if (!parse(initialcategories)) {
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => {
          // Categories API returns array directly
          setCategories(Array.isArray(data) ? [...data].sort((a, b) => a.name.localeCompare(b.name)) : []);
        })
        .catch(console.error);
    }

    // Initialize store with URL parameters
    initialize({
      searchQuery: initialsearchquery,
      categoryId: initialcategoryid,
      seeded: seededAtStart,
    });
    setStarted(true);
  }, [initialize, initialsearchquery, initialcategoryid, initialcategories, seededAtStart]);

  // Apply the price range once typing pauses, instead of on every keystroke
  useEffect(() => {
    if (priceRange.min === minPrice && priceRange.max === maxPrice) return undefined;

    const timer = setTimeout(() => {
      setFilters({ minPrice: priceRange.min, maxPrice: priceRange.max });
    }, 400);
    return () => clearTimeout(timer);
  }, [priceRange, minPrice, maxPrice, setFilters]);

  // Continuous loading: fetch the next page shortly before the end of the grid
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, products.length]);

  const hasFilters = Boolean(selectedCategory || minPrice || maxPrice || productStatus);
  const activeFilterCount = [minPrice || maxPrice, productStatus].filter(Boolean).length;

  const clearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setFilters({
      selectedCategory: '',
      minPrice: '',
      maxPrice: '',
      productStatus: '',
    });
  };

  const isFirstLoad = !started || (isLoading && products.length === 0);

  // The next page has an address only while the grid shows the page's own listing, unfiltered and in the default order
  const pristine = !searchQuery && !minPrice && !maxPrice && !productStatus && sortBy === 'created_at' && sortDirection === 'desc' && String(selectedCategory || '') === String(initialcategoryid || '');
  const nextPageUrl = pagebase && pristine && hasMore ? `${pagebase}?page=${currentPage + 1}` : null;

  return (
    <div>
      {/* Category chips */}
      {categories.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setFilters({ selectedCategory: '' })}
            aria-pressed={!selectedCategory}
            className={`chip ${!selectedCategory ? 'chip-active' : ''}`}
          >
            All
          </button>
          {categories.map((category) => {
            const active = String(selectedCategory) === String(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setFilters({ selectedCategory: active ? '' : category.id })}
                aria-pressed={active}
                className={`chip ${active ? 'chip-active' : ''}`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Count, filters and sort */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p className="text-sm text-gray-600" aria-live="polite">
          {isFirstLoad ? (
            'Loading products'
          ) : (
            <>
              <span className="font-semibold text-ink tabular-nums">{totalProducts.toLocaleString('en-NG')}</span>{' '}
              {totalProducts === 1 ? 'product' : 'products'}
              {searchQuery ? ', best match first' : ''}
            </>
          )}
        </p>

        <div className="flex items-center gap-2 lg:order-last">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="product-filters"
            className={`chip lg:hidden ${activeFilterCount > 0 ? 'chip-active' : ''}`}
          >
            <Setting4 size={16} color="currentColor" variant="Linear" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>

          {!searchQuery && (
            <label className="relative block">
              <span className="sr-only">Sort products</span>
              <select
                value={`${sortBy}:${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split(':');
                  setSortBy(field, direction);
                }}
                className="h-9 cursor-pointer appearance-none rounded-full border border-gray-200 bg-white pr-9 pl-4 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400"
              >
                {SORTS.map((sort) => (
                  <option key={sort.value} value={sort.value}>
                    {sort.label}
                  </option>
                ))}
              </select>
              <ArrowDown2
                size={14}
                color="currentColor"
                variant="Linear"
                className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-500"
              />
            </label>
          )}
        </div>

        {/* Condition and price: always visible on desktop, behind the Filters chip on small screens */}
        <div
          id="product-filters"
          className={`${filtersOpen ? 'flex' : 'hidden'} w-full flex-wrap items-center gap-x-6 gap-y-3 lg:flex lg:w-auto lg:flex-1 lg:justify-end`}
        >
          <div className="flex rounded-full bg-gray-200/70 p-1" role="group" aria-label="Condition">
            {CONDITIONS.map((condition) => {
              const active = productStatus === condition.value;
              return (
                <button
                  key={condition.value || 'all'}
                  type="button"
                  onClick={() => setFilters({ productStatus: condition.value })}
                  aria-pressed={active}
                  className={`h-7 rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                    active ? 'bg-white text-ink' : 'text-gray-600 hover:text-ink'
                  }`}
                >
                  {condition.label}
                </button>
              );
            })}
          </div>

          <fieldset className="flex items-center gap-2">
            <legend className="sr-only">Price range in naira</legend>
            <span className="text-xs font-semibold text-gray-600" aria-hidden="true">
              Price
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={priceRange.min}
              onChange={(e) => setPriceRange((range) => ({ ...range, min: e.target.value }))}
              placeholder="Min"
              aria-label="Minimum price"
              className="field h-9 w-24 rounded-full px-3.5"
            />
            <span className="text-gray-400" aria-hidden="true">
              to
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={priceRange.max}
              onChange={(e) => setPriceRange((range) => ({ ...range, max: e.target.value }))}
              placeholder="Max"
              aria-label="Maximum price"
              className="field h-9 w-24 rounded-full px-3.5"
            />
          </fieldset>

          {hasFilters && (
            <button type="button" onClick={clearFilters} className="text-sm font-semibold text-brand hover:text-brand-dark">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Product grid */}
      <div className="mt-5">
        {isFirstLoad ? (
          <div className={GRID}>
            {[...Array(12)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : loadError && products.length === 0 ? (
          <div className="panel flex flex-col items-center px-6 py-16 text-center">
            <h3 className="text-lg font-bold">We could not load the products</h3>
            <p className="mt-2 max-w-sm text-sm text-gray-600">Check your connection and try again.</p>
            <button type="button" onClick={() => loadProducts()} className="btn btn-primary mt-6">
              <Refresh size={18} color="currentColor" variant="Linear" />
              Try again
            </button>
          </div>
        ) : products.length > 0 ? (
          <>
            {/* The server's cards are already on screen, so the same cards do not rise in again */}
            <div className={`${seeded ? '' : 'stagger '}${GRID}`}>
              {products.map((product, index) => (
                <ProductCard key={`${product.type || 'product'}-${product.id}`} product={product} index={index % 30} />
              ))}
              {isLoading && [...Array(6)].map((_, i) => <ProductCardSkeleton key={`more-${i}`} />)}
            </div>

            {hasMore ? (
              <div ref={sentinelRef} className="flex justify-center pt-8">
                {nextPageUrl ? (
                  // A real link to the next page, for search engines and for opening in a new tab;
                  // a plain click loads the next products in place
                  <a
                    href={nextPageUrl}
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                      event.preventDefault();
                      if (!isLoading) loadMore();
                    }}
                    className="btn btn-outline"
                  >
                    {isLoading ? 'Loading more' : 'Load more products'}
                  </a>
                ) : (
                  <button type="button" onClick={loadMore} disabled={isLoading} className="btn btn-outline">
                    {isLoading ? 'Loading more' : 'Load more products'}
                  </button>
                )}
              </div>
            ) : (
              products.length > 12 && (
                <p className="pt-8 text-center text-sm text-gray-500">That is all {totalProducts.toLocaleString('en-NG')} products.</p>
              )
            )}
          </>
        ) : (
          <div className="panel flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <BoxSearch size={28} color="currentColor" variant="Linear" />
            </span>
            <h3 className="mt-4 text-lg font-bold">No products match</h3>
            <p className="mt-2 max-w-sm text-sm text-gray-600">
              {searchQuery ? `Nothing matched "${searchQuery}". Try a shorter search or remove a filter.` : 'Try removing a filter or widening the price range.'}
            </p>
            {hasFilters ? (
              <button type="button" onClick={clearFilters} className="btn btn-primary mt-6">
                Clear filters
              </button>
            ) : (
              <a href="/" className="btn btn-primary mt-6">
                Browse all products
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
