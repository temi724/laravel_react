import React, { useMemo } from 'react';
import { ArrowRight2, ShoppingCart, TickCircle } from 'iconsax-react';
import ProductImage from './ProductImage';
import useCartStore from '../stores/cartStore';
import { formatPrice, productUrl } from '../lib/format';
import { bundleContents } from '../lib/offers';

// The page for one bundle: what is inside it, what it costs together and what that saves.
// `bundle` arrives as a JSON string from a data-prop-bundle attribute.
const BundleShow = ({ bundle: raw = '{}' }) => {
  const { addToCart, isLoading } = useCartStore();

  const bundle = useMemo(() => {
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (error) {
      console.error('BundleShow could not read its bundle:', error);
      return null;
    }
  }, [raw]);

  if (!bundle || !Array.isArray(bundle.items)) return null;

  const add = () =>
    addToCart(bundle.id, 1, 'bundle', null, null, null, {
      product_name: bundle.name,
      price: bundle.price,
      images_url: [bundle.items[0]?.product?.image].filter(Boolean),
      url: bundle.url,
      note: bundleContents(bundle),
    });

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
          <li>
            <a href="/" className="hover:text-ink">
              Home
            </a>
          </li>
          <li aria-hidden="true">
            <ArrowRight2 size={12} color="currentColor" variant="Linear" />
          </li>
          <li>
            <a href="/#bundles" className="hover:text-ink">
              Bundles
            </a>
          </li>
          <li aria-hidden="true">
            <ArrowRight2 size={12} color="currentColor" variant="Linear" />
          </li>
          <li className="max-w-[60vw] truncate text-ink" aria-current="page">
            {bundle.name}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
        {/* What is inside */}
        <div>
          <h1 className="text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">{bundle.name}</h1>
          {bundle.description && <p className="mt-2 max-w-[65ch] leading-relaxed whitespace-pre-line text-gray-700">{bundle.description}</p>}

          <h2 className="mt-7 text-base font-bold">In this bundle</h2>
          <ul className="panel mt-3 divide-y divide-gray-100 px-4 sm:px-6">
            {bundle.items.map((item, index) => {
              const product = item.product || {};
              const url = productUrl(product);

              return (
                <li key={`${item.product_id}-${index}`} className="flex items-center gap-4 py-4">
                  <a href={url} tabIndex={-1} aria-hidden="true">
                    <ProductImage src={product.image} className="size-20 rounded-2xl sm:size-24" iconSize={28} />
                  </a>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      <a href={url} className="hover:text-brand">
                        {product.product_name}
                      </a>
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600">{[item.storage, product.category, item.quantity > 1 ? `Quantity ${item.quantity}` : null].filter(Boolean).join(', ')}</p>
                    {!item.available && <p className="mt-0.5 text-sm font-semibold text-sale">Out of stock</p>}
                  </div>
                  <p className="shrink-0 text-sm text-gray-600 tabular-nums">
                    {formatPrice((item.unit_price || 0) * item.quantity)}
                    <span className="sr-only"> if bought on its own</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Price and buying */}
        <aside className="panel p-5 sm:p-6 lg:sticky lg:top-36" aria-label="Bundle price">
          <dl className="space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-gray-600">Bought separately</dt>
              <dd className="text-gray-600 tabular-nums">
                <s>{formatPrice(bundle.usual_price)}</s>
              </dd>
            </div>
            {bundle.saving > 0 && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-semibold text-sale">You save</dt>
                <dd className="font-semibold text-sale tabular-nums">{formatPrice(bundle.saving)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 border-t border-gray-200 pt-3">
              <dt className="font-bold">Bundle price</dt>
              <dd className="text-3xl font-extrabold tracking-tight tabular-nums">{formatPrice(bundle.price)}</dd>
            </div>
          </dl>

          <button type="button" onClick={add} disabled={isLoading || !bundle.in_stock} className="btn btn-lg btn-primary mt-5 w-full">
            <ShoppingCart size={20} color="currentColor" variant="Linear" />
            {!bundle.in_stock ? 'Out of stock' : isLoading ? 'Adding' : 'Add bundle to cart'}
          </button>

          <ul className="mt-5 space-y-2 text-sm text-gray-700">
            {['All the items come in one order', 'Each item keeps its own serial number on your invoice', 'Pick up in store or have it delivered'].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <TickCircle size={18} color="currentColor" variant="Linear" className="mt-px shrink-0 text-brand" />
                {line}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default BundleShow;
