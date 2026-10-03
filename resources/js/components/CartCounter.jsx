import React from 'react';
import useCartStore from '../stores/cartStore';

// Count badge that sits on the corner of the header cart button
const CartCounter = () => {
  const { cartCount } = useCartStore();

  if (cartCount === 0) {
    return null; // Don't show counter when cart is empty
  }

  return (
    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] leading-none font-bold text-ink ring-2 ring-ink tabular-nums">
      <span className="sr-only">Items in cart: </span>
      {cartCount > 99 ? '99+' : cartCount}
    </span>
  );
};

export default CartCounter;
