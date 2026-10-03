import React from 'react';

const TONES = {
  neutral: 'bg-gray-100 text-gray-700',
  brand: 'bg-brand-light text-brand',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-sale-light text-sale',
  ink: 'bg-ink text-white',
};

const Badge = ({ tone = 'neutral', className = '', children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap ${TONES[tone] || TONES.neutral} ${className}`}>
    {children}
  </span>
);

// One place that decides how each status looks, so every screen agrees

export const OrderStatusBadge = ({ completed }) => <Badge tone={completed ? 'success' : 'warning'}>{completed ? 'Completed' : 'Pending'}</Badge>;

const PAYMENT_TONES = { pending: 'warning', completed: 'success', paid: 'success', failed: 'danger', refunded: 'neutral' };

export const PaymentStatusBadge = ({ status }) => {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  return <Badge tone={PAYMENT_TONES[status] || 'neutral'}>{label}</Badge>;
};

export const StockBadge = ({ inStock }) => <Badge tone={inStock ? 'success' : 'danger'}>{inStock ? 'In stock' : 'Out of stock'}</Badge>;

export default Badge;
