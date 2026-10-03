import React, { useState } from 'react';
import { Add, ArrowRight2, Gallery } from 'iconsax-react';
import useCartStore from '../stores/cartStore';
import useOffersStore from '../stores/offersStore';
import { conditionLabel, discountPercent, formatPrice, productUrl } from '../lib/format';
import { formatMoment, holdFor, promoFor } from '../lib/offers';

// Marketplace-style product card: inset image with its own radius, condition
// pill on the image, two-line title, bold price, one meta line and a quick-add
// button. Nothing is revealed on hover, so it reads the same on touch screens.
// Cards in a row are all as tall as the tallest: the card fills its cell and the
// price block sits at the bottom, whatever each card has above it.
const ProductCard = ({ product, index = 0 }) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const [imageFailed, setImageFailed] = useState(false);

  const type = product.type || 'product';
  const url = productUrl(product);
  const image = product.images_url && product.images_url.length > 0 ? product.images_url[0] : null;
  // A deal of the day or a live drop changes the price; a drop still to come holds the product back
  const offers = useOffersStore((state) => state.data);
  const promo = type === 'product' ? promoFor(offers, product.id, product.default_storage) : null;
  const hold = type === 'product' ? holdFor(offers, product.id) : null;
  const usualPrice = product.display_price ?? product.price;
  const price = promo ? promo.price : usualPrice;
  const discount = type === 'deal' ? discountPercent(product.old_price, product.price) : 0;
  const hasOptions =
    (Array.isArray(product.storage_options) && product.storage_options.length > 0) ||
    (Array.isArray(product.colors) && product.colors.length > 0);
  const meta = [product.category?.name, product.default_storage].filter(Boolean).join(' · ');

  const trackView = () => {
    if (window.trackProductView) {
      window.trackProductView(product.id, product.product_name);
    }
  };

  const handleQuickAdd = async () => {
    try {
      await addToCart(product.id, 1, type, null, null, null, promo ? { ...product, price: promo.price } : product);

      // Track checkout event for analytics
      if (window.trackCheckoutEvent) {
        window.trackCheckoutEvent('cart_add', {
          product_id: product.id,
          product_name: product.product_name,
          quantity: 1,
          value: product.price,
        });
      }
    } catch (error) {
      console.error('ProductCard addToCart failed:', error);
    }
  };

  return (
    <article
      // Its own text colour: the card is white wherever it sits, including on a coloured band
      className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-2 text-ink transition-colors hover:border-gray-300"
      style={{ '--i': index }}
    >
      <a
        href={url}
        onClick={trackView}
        className="relative block aspect-square overflow-hidden rounded-xl bg-gray-100"
        tabIndex={-1}
        aria-hidden="true"
      >
        {image && !imageFailed ? (
          <img
            src={image}
            alt={product.product_name}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className={`size-full object-cover ${product.in_stock ? '' : 'opacity-60'}`}
          />
        ) : (
          <span className="flex size-full items-center justify-center text-gray-300">
            <Gallery size={36} color="currentColor" variant="Linear" />
          </span>
        )}

        {product.in_stock ? (
          <span className="absolute top-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] leading-none font-semibold text-ink">
            {conditionLabel(product.product_status)}
          </span>
        ) : (
          <span className="absolute top-2 left-2 rounded-full bg-ink px-2.5 py-1 text-[11px] leading-none font-semibold text-white">
            Out of stock
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1.5">
        <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-medium">
          <a href={url} onClick={trackView} className="rounded-sm">
            {product.product_name}
          </a>
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <p className="text-lg leading-6 font-extrabold tracking-tight tabular-nums">{formatPrice(price)}</p>
            {discount > 0 && (
              <p className="text-xs leading-5 text-gray-500 tabular-nums">
                <s>{formatPrice(product.old_price)}</s>{' '}
                <span className="font-semibold text-sale">-{discount}%</span>
              </p>
            )}
            {promo && (
              <p className="truncate text-xs leading-5 text-gray-500 tabular-nums">
                <s>{formatPrice(promo.usual_price ?? usualPrice)}</s> <span className="font-semibold text-sale">{promo.label}</span>
              </p>
            )}
            {hold && <p className="truncate text-xs leading-5 font-semibold text-brand">Drops {formatMoment(hold.starts_at)}</p>}
            {meta && <p className="truncate text-xs leading-5 text-gray-500">{meta}</p>}
          </div>

          {product.in_stock &&
            (hasOptions || hold ? (
              <a
                href={url}
                onClick={trackView}
                aria-label={hold ? `See when ${product.product_name} drops` : `Choose options for ${product.product_name}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-300 text-ink transition-[transform,border-color] duration-200 ease-out hover:border-ink active:scale-[0.97]"
              >
                <ArrowRight2 size={16} color="currentColor" variant="Linear" />
              </a>
            ) : (
              <button
                type="button"
                onClick={handleQuickAdd}
                aria-label={`Add ${product.product_name} to cart`}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-300 text-ink transition-[transform,border-color] duration-200 ease-out hover:border-ink active:scale-[0.97]"
              >
                <Add size={18} color="currentColor" variant="Linear" />
              </button>
            ))}
        </div>
      </div>
    </article>
  );
};

export const ProductCardSkeleton = () => (
  <div className="rounded-2xl border border-gray-200 bg-white p-2" aria-hidden="true">
    <div className="aspect-square animate-pulse rounded-xl bg-gray-100" />
    <div className="px-1.5 pt-3 pb-1.5">
      <div className="h-3.5 w-11/12 animate-pulse rounded-full bg-gray-100" />
      <div className="mt-2 h-3.5 w-2/3 animate-pulse rounded-full bg-gray-100" />
      <div className="mt-3 h-5 w-1/2 animate-pulse rounded-full bg-gray-100" />
    </div>
  </div>
);

export default ProductCard;
