import React from 'react';
import { ArrowRight2 } from 'iconsax-react';
import ProductImage from './ProductImage';
import useOffersStore from '../stores/offersStore';
import { formatPrice } from '../lib/format';
import { bundleContents } from '../lib/offers';

// One bundle: the products inside it side by side, what they cost together and what that saves
export const BundleCard = ({ bundle }) => {
  const photos = bundle.items.slice(0, 3);
  const more = bundle.items.length - photos.length;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-2 text-ink transition-colors hover:border-gray-300">
      <a href={bundle.url} className="flex gap-1.5" tabIndex={-1} aria-hidden="true">
        {photos.map((item, index) => (
          <ProductImage key={`${item.product_id}-${index}`} src={item.product?.image} className="aspect-square min-w-0 flex-1 rounded-xl" iconSize={24} />
        ))}
        {more > 0 && <span className="flex aspect-square w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-600">+{more}</span>}
      </a>

      <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1.5">
        <h3 className="text-base leading-6 font-bold">
          <a href={bundle.url} className="rounded-sm">
            {bundle.name}
          </a>
        </h3>
        <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{bundleContents(bundle)}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <p className="text-lg leading-6 font-extrabold tracking-tight tabular-nums">{formatPrice(bundle.price)}</p>
            {bundle.in_stock ? (
              bundle.saving > 0 && (
                <p className="text-xs leading-5 text-gray-500 tabular-nums">
                  <s>{formatPrice(bundle.usual_price)}</s> <span className="font-semibold text-sale">Save {formatPrice(bundle.saving)} as a set</span>
                </p>
              )
            ) : (
              <p className="text-xs leading-5 font-semibold text-gray-500">An item in this set is out of stock</p>
            )}
          </div>

          <a
            href={bundle.url}
            aria-label={`See what is in ${bundle.name}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-300 text-ink transition-[transform,border-color] duration-200 ease-out hover:border-ink active:scale-[0.97]"
          >
            <ArrowRight2 size={16} color="currentColor" variant="Linear" />
          </a>
        </div>
      </div>
    </article>
  );
};

// The bundles section of the home page. Renders nothing when there are no bundles.
const BundleRail = () => {
  const bundles = useOffersStore((state) => state.data.bundles);
  if (!bundles || bundles.length === 0) return null;

  return (
    <section className="scroll-mt-32 pt-10" id="bundles" aria-labelledby="bundles-title">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 id="bundles-title" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Better together, cheaper together
          </h2>
          <p className="mt-1 max-w-[65ch] text-sm text-gray-600">Gadgets that work as one, matched for you and priced lower as a set than bought one by one.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BundleRail;
