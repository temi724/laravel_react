import React, { useEffect, useId, useRef, useState } from 'react';
import { CloseCircle, SearchNormal1 } from 'iconsax-react';
import ProductImage from './ProductImage';
import { formatPrice, productUrl } from '../lib/format';

const SearchBar = ({ placeholder = 'Search products' }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const listId = useId();
  const requestRef = useRef(0);

  const trimmed = query.trim();

  // Fetch suggestions once typing pauses; a newer request always wins over an older one
  useEffect(() => {
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    const requestId = ++requestRef.current;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(trimmed)}`);
        const data = await response.json();
        if (requestId === requestRef.current) {
          setSuggestions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        if (requestId === requestRef.current) setSuggestions([]);
      } finally {
        if (requestId === requestRef.current) setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [trimmed]);

  const goToResults = () => {
    if (trimmed) {
      // Always navigate to search results page
      window.location.href = `/search?q=${encodeURIComponent(trimmed)}`;
    }
  };

  const goToSuggestion = (suggestion) => {
    window.location.href = productUrl({ id: suggestion.id, product_name: suggestion.name, url: suggestion.url });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (highlighted >= 0 && suggestions[highlighted]) {
      goToSuggestion(suggestions[highlighted]);
    } else {
      goToResults();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setOpen(true);
      setHighlighted((index) => (index + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setHighlighted((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    }
  };

  const showPanel = open && trimmed.length >= 2;

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} role="search" className="relative flex h-11 items-center rounded-full bg-white pr-1 pl-4 text-ink">
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search products
        </label>
        <input
          id={`${listId}-input`}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onFocus={() => setOpen(true)}
          // Delay hiding suggestions to allow clicks
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-full min-w-0 flex-1 appearance-none bg-transparent text-base outline-none placeholder:text-gray-500 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
            aria-label="Clear search"
            className="mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-ink"
          >
            <CloseCircle size={18} color="currentColor" variant="Linear" />
          </button>
        )}

        <button
          type="submit"
          aria-label="Search"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-[transform,background-color] duration-200 ease-out hover:bg-ink-raised active:scale-[0.97]"
        >
          <SearchNormal1 size={18} color="currentColor" variant="Linear" />
        </button>
      </form>

      {/* Search suggestions */}
      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 origin-top animate-pop overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 text-ink shadow-[0_18px_40px_-16px_rgba(20,23,28,0.35)]"
        >
          {isLoading && suggestions.length === 0 ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2" aria-hidden="true">
                <div className="size-11 animate-pulse rounded-xl bg-gray-100" />
                <div className="flex-1">
                  <div className="h-3.5 w-3/5 animate-pulse rounded-full bg-gray-100" />
                  <div className="mt-2 h-3 w-1/4 animate-pulse rounded-full bg-gray-100" />
                </div>
              </div>
            ))
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  type="button"
                  role="option"
                  aria-selected={highlighted === index}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goToSuggestion(suggestion)}
                  className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                    highlighted === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <ProductImage src={suggestion.image} className="size-11 rounded-xl" iconSize={18} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{suggestion.name}</span>
                    <span className="block text-sm text-gray-600 tabular-nums">
                      {formatPrice(suggestion.price)}
                      {suggestion.type === 'deal' && <span className="ml-2 font-semibold text-sale">Deal</span>}
                    </span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={goToResults}
                className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-gray-100 px-2 pt-3 pb-2 text-left text-sm font-semibold text-brand hover:text-brand-dark"
              >
                <SearchNormal1 size={16} color="currentColor" variant="Linear" />
                See all results for &ldquo;{trimmed}&rdquo;
              </button>
            </>
          ) : (
            <p className="px-3 py-4 text-sm text-gray-600">No products match &ldquo;{trimmed}&rdquo;.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
