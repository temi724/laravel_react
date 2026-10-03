import React from 'react';
import { ShoppingCart } from 'iconsax-react';
import Countdown from './Countdown';
import ProductImage from './ProductImage';
import useCartStore from '../stores/cartStore';
import useOffersStore, { serverNow } from '../stores/offersStore';
import { formatPrice, productUrl } from '../lib/format';
import { formatMoment, orderLimit } from '../lib/offers';

// Where a drop stands, in the real numbers: how many there are, how many are left, how many went
const dropStatus = (drop, upcoming, live) => {
  const units = drop.quantity_limit;

  if (upcoming) {
    return units ? `${units} ${units === 1 ? 'unit drops' : 'units drop'} ${formatMoment(drop.starts_at)}` : `Drops ${formatMoment(drop.starts_at)}`;
  }
  if (live) {
    if (drop.remaining === null) return 'Live now';
    return drop.remaining === 1 ? 'Live now. Last one' : `Live now. ${drop.remaining} of ${units} left`;
  }
  return drop.status === 'sold_out' && units > 1 ? `Sold out. All ${units} taken` : 'Sold out';
};

// One drop: a limited number of units at a special price, released at a set time
const DropCard = ({ drop, onChange }) => {
  const { addToCart, isLoading } = useCartStore();
  const { product } = drop;
  const url = productUrl(product);
  const upcoming = drop.status === 'scheduled' && new Date(drop.starts_at).getTime() > serverNow();
  const live = drop.status === 'live' && product.in_stock;
  const tone = upcoming ? 'text-brand-soft' : live ? 'text-white' : 'text-white/60';

  const add = () => addToCart(product.id, 1, 'product', drop.storage || null, drop.storage ? drop.price : null, null, { ...product, price: drop.price });

  return (
    <article className="flex w-[78%] shrink-0 snap-start flex-col rounded-2xl bg-ink-raised p-2 sm:w-72">
      <a href={url} className="block" tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.image} className="aspect-[4/3] w-full rounded-xl" iconSize={36} />
      </a>

      <div className="flex flex-1 flex-col px-2 pt-3 pb-2">
        <p className={`text-xs font-bold ${tone}`}>{dropStatus(drop, upcoming, live)}</p>

        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 font-semibold">
          <a href={url} className="rounded-sm">
            {drop.headline || product.product_name}
            {drop.storage ? ` ${drop.storage}` : ''}
          </a>
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <p className="text-lg leading-6 font-extrabold tracking-tight tabular-nums">{formatPrice(drop.price)}</p>
            {drop.usual_price > drop.price && (
              <p className="text-xs leading-5 text-white/60 tabular-nums">
                <s>{formatPrice(drop.usual_price)}</s>
              </p>
            )}
          </div>

          {upcoming ? (
            <p className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold">
              <Countdown to={drop.starts_at} onDone={onChange} />
            </p>
          ) : live ? (
            <button type="button" onClick={add} disabled={isLoading} className="btn btn-sm btn-primary shrink-0">
              <ShoppingCart size={16} color="currentColor" variant="Linear" />
              Add to cart
            </button>
          ) : null}
        </div>

        {drop.per_order_limit && (upcoming || live) && <p className="mt-2 text-xs text-white/60">{orderLimit(drop.per_order_limit)}</p>}
      </div>
    </article>
  );
};

// The drops section of the home page: an ink band with the drops that are live or still to come,
// in a row that scrolls sideways. Renders nothing when there are none.
const DropsRail = () => {
  const drops = useOffersStore((state) => state.data.drops);
  const refresh = useOffersStore((state) => state.refresh);

  const shown = (drops || []).filter((drop) => drop.product);
  if (shown.length === 0) return null;

  return (
    <section className="scroll-mt-28 bg-ink py-9 text-white sm:py-11" id="drops" aria-labelledby="drops-title">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-5 sm:mb-6">
          <h2 id="drops-title" className="text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
            Drops: be early, pay less
          </h2>
          <p className="mt-1 max-w-[60ch] text-sm text-white/75">
            A small batch at a lower price, released at the time on the card. First come, first served, and when the last unit goes, the price goes with it.
          </p>
        </div>

        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 sm:mx-0 sm:scroll-px-0 sm:px-0">
          {shown.map((drop) => (
            <DropCard key={drop.id} drop={drop} onChange={refresh} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DropsRail;
