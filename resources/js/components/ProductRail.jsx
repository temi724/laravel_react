import React, { useMemo } from 'react';
import ProductCard from './ProductCard';

// A single horizontal row of product cards that scrolls sideways.
// `items` arrives as a JSON string from a data-prop-items attribute.
const ProductRail = ({ items = '[]', type = 'product' }) => {
  const products = useMemo(() => {
    try {
      const parsed = typeof items === 'string' ? JSON.parse(items) : items;
      return Array.isArray(parsed) ? parsed.map((item) => ({ ...item, type: item.type || type })) : [];
    } catch (error) {
      console.error('ProductRail could not read its items:', error);
      return [];
    }
  }, [items, type]);

  if (products.length === 0) return null;

  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4 sm:mx-0 sm:scroll-px-0 sm:gap-3 sm:px-0">
      {products.map((product, index) => (
        // The row stretches every cell to the tallest card, and the card fills its cell
        <div key={`${product.type}-${product.id}`} className="flex w-[46%] shrink-0 snap-start flex-col sm:w-56">
          <ProductCard product={product} index={index} />
        </div>
      ))}
    </div>
  );
};

export default ProductRail;
