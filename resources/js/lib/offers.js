// Reading the offers the page was given (stores/offersStore.js)

const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

// The special price running on a product for a storage size right now, or null.
// An offer whose time has passed on this device no longer counts, even before the page refreshes.
export const promoFor = (offers, productId, storage, now = Date.now()) =>
  (offers?.prices?.[productId] || []).find(
    (promo) => same(promo.storage, storage) && (!promo.ends_at || new Date(promo.ends_at).getTime() > now) && (promo.remaining === null || promo.remaining > 0)
  ) || null;

// A drop that has not started: until it does, the product cannot be bought
export const holdFor = (offers, productId, now = Date.now()) => {
  const hold = offers?.holds?.[productId];
  return hold && new Date(hold.starts_at).getTime() > now ? hold : null;
};

// "Fri 4 Oct, 6:00 pm" in the shopper's own time zone
export const formatMoment = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

// "Only 3 left at this price". The count is the real one; "only" is kept for when it is low.
export const leftAtPrice = (remaining) => {
  if (remaining === null || remaining === undefined || remaining <= 0) return null;
  if (remaining === 1) return 'Last one at this price';
  return `${remaining <= 5 ? 'Only ' : ''}${remaining} left at this price`;
};

// The limit with its reason, which reads as fair rather than as a restriction
export const orderLimit = (limit) => (limit ? `Limit ${limit} per order, so more people get one` : null);

// "iPhone 17 + iPad Air + 2 AirPods Pro"
export const bundleContents = (bundle) =>
  (bundle?.items || []).map((item) => `${item.quantity > 1 ? `${item.quantity} ` : ''}${item.product?.product_name || 'Product'}`).join(' + ');
