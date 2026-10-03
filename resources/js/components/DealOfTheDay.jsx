import React from 'react';
import { ShoppingCart } from 'iconsax-react';
import Countdown from './Countdown';
import ProductImage from './ProductImage';
import useCartStore from '../stores/cartStore';
import useOffersStore from '../stores/offersStore';
import { conditionLabel, formatPrice, productUrl } from '../lib/format';
import { leftAtPrice, orderLimit } from '../lib/offers';

// Today's deal on the home page: one product, its price for the day and the time left.
// Renders nothing when there is no deal running.
const DealOfTheDay = () => {
  const deal = useOffersStore((state) => state.data.deal_of_day);
  const refresh = useOffersStore((state) => state.refresh);
  const { addToCart, isLoading } = useCartStore();

  if (!deal || !deal.product) return null;

  const { product } = deal;
  const url = productUrl(product);
  const saving = deal.usual_price ? Math.max(0, deal.usual_price - deal.price) : 0;
  const soldOut = !product.in_stock;
  const smallPrint = [leftAtPrice(deal.remaining), orderLimit(deal.per_order_limit)].filter(Boolean).join('. ');

  const add = () =>
    // At the deal price, for the size the deal is on
    addToCart(product.id, 1, 'product', deal.storage || null, deal.storage ? deal.price : null, null, { ...product, price: deal.price });

  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8" aria-labelledby="deal-of-the-day">
      <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-gray-200 bg-white md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <a href={url} className="block bg-gray-100" tabIndex={-1} aria-hidden="true">
          <ProductImage src={product.image} className="aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-80" iconSize={48} eager />
        </a>

        <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="deal-of-the-day" className="rounded-full bg-sale px-3 py-1 text-xs font-bold text-white">
              Deal of the day
            </h2>
            <span className="text-xs font-semibold text-gray-600">{conditionLabel(product.product_status)}</span>
          </div>

          <p className="mt-3 text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
            <a href={url} className="hover:text-brand">
              {deal.headline || product.product_name}
              {deal.storage ? ` ${deal.storage}` : ''}
            </a>
          </p>
          {deal.headline && <p className="mt-1 text-sm text-gray-600">{product.product_name}</p>}
          {product.overview && <p className="mt-2 line-clamp-2 max-w-[52ch] text-sm leading-relaxed text-gray-700">{product.overview}</p>}

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">{formatPrice(deal.price)}</span>
            {saving > 0 && (
              <>
                <s className="text-lg text-gray-500 tabular-nums">{formatPrice(deal.usual_price)}</s>
                <span className="rounded-full bg-sale-light px-2.5 py-1 text-xs font-bold text-sale">Save {formatPrice(saving)}</span>
              </>
            )}
          </div>

          {deal.ends_at && (
            <div className="mt-6">
              {/* What waiting costs: the price it returns to, and when */}
              <p className="mb-2 text-sm font-semibold">{saving > 0 ? `Back to ${formatPrice(deal.usual_price)} in` : 'This price ends in'}</p>
              <Countdown to={deal.ends_at} onDone={refresh} variant="tiles" />
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" onClick={add} disabled={isLoading || soldOut} className="btn btn-lg btn-primary">
              <ShoppingCart size={20} color="currentColor" variant="Linear" />
              {soldOut ? 'Sold out' : 'Add to cart'}
              {/* The saving, named again where the decision is made; left off the narrowest phones so the label stays on one line */}
              {!soldOut && saving > 0 && <span className="max-[399px]:hidden">, save {formatPrice(saving)}</span>}
            </button>
            <a href={url} className="btn btn-lg btn-outline">
              See full details
            </a>
          </div>

          {smallPrint && <p className="mt-3 text-sm text-gray-600">{smallPrint}.</p>}
        </div>
      </div>
    </section>
  );
};

export default DealOfTheDay;
