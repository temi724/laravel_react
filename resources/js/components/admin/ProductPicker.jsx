import React, { useEffect, useId, useRef, useState } from 'react';
import { Input } from './ui';
import { api, formatPrice } from '../../lib/admin';

// A text box that suggests products from the catalogue as you type.
// Picking one calls onPick(product); typing something else is kept as plain text via onChange,
// for an item that is not in the product list.
const ProductPicker = ({ value, onChange, onPick, size = 'md', placeholder = 'Search the product list', ...props }) => {
  const listId = useId();
  const blurTimer = useRef(null);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searching, setSearching] = useState(false);
  // Skips the search that would otherwise fire for the name a pick has just filled in
  const skipSearch = useRef(true);

  // Search once typing pauses
  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return undefined;
    }

    const term = value.trim();
    if (term.length < 2) {
      setResults([]);
      setOpen(false);
      return undefined;
    }

    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { ok, data } = await api(`/api/admin/products?${new URLSearchParams({ search: term, type: 'product' })}`);
        if (cancelled) return;
        setResults(ok ? (data?.products || []).slice(0, 8) : []);
        setActive(-1);
        setOpen(true);
      } catch (error) {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const pick = (product) => {
    if (!product.in_stock) return;
    skipSearch.current = true;
    setOpen(false);
    setResults([]);
    onPick(product);
  };

  const onKeyDown = (event) => {
    if (!open || results.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + results.length) % results.length);
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      pick(results[active]);
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Input
        {...props}
        size={size}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          skipSearch.current = false;
          onChange(e.target.value);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        // A click on a suggestion lands before the list closes
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
      />

      {open && (
        <ul id={listId} role="listbox" className="absolute top-full right-0 left-0 z-20 mt-1 max-h-72 animate-pop overflow-y-auto rounded-2xl border border-gray-200 bg-white p-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-600">{searching ? 'Searching' : 'No product with that name. It will be saved as typed, without changing stock.'}</li>
          ) : (
            results.map((product, index) => (
              <li
                key={product.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                aria-disabled={!product.in_stock}
                // mousedown keeps the focus in the text box, so the pick is not lost to the blur
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(product)}
                onMouseEnter={() => setActive(index)}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${product.in_stock ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${index === active ? 'bg-gray-100' : ''}`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{product.product_name}</span>
                  <span className="block text-xs text-gray-500 tabular-nums">{product.in_stock ? `${product.stock_quantity} in stock` : 'Out of stock'}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{formatPrice(product.display_price ?? product.price)}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default ProductPicker;
