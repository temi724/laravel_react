// Shared formatting helpers for the storefront components

// Whole naira where possible: ₦250,000 rather than ₦250,000.00. Kobo is kept when a price has it.
export const formatPrice = (amount) => {
  const value = Number.parseFloat(amount);
  if (!Number.isFinite(value)) return '₦0';

  const hasKobo = Math.round(value * 100) % 100 !== 0;
  return `₦${value.toLocaleString('en-NG', {
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};

// The product's page. The server sends the address with each product; the slug built here
// is only for objects that came without one (older cart entries).
export const productUrl = (product) => {
  if (product.url) return product.url;

  const slug = (product.product_name || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
  return `/product/${product.id}/${slug}`;
};

const CONDITIONS = {
  new: 'New',
  uk_used: 'UK used',
  refurbished: 'Refurbished',
};

export const conditionLabel = (status) => {
  if (!status) return CONDITIONS.new;
  return CONDITIONS[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
};

// Percentage saved on a deal, or 0 when there is no real saving
export const discountPercent = (oldPrice, price) => {
  const before = Number.parseFloat(oldPrice);
  const now = Number.parseFloat(price);
  if (!Number.isFinite(before) || !Number.isFinite(now) || before <= now) return 0;
  return Math.round(((before - now) / before) * 100);
};

export const colorName = (color) =>
  typeof color === 'object' && color !== null ? color.name || Object.values(color)[0] || '' : color || '';
