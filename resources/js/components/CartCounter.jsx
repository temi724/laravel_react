import React from 'react';
import useCartStore from '../stores/cartStore';

const CartCounter = () => {
  const { cartCount } = useCartStore();

  if (cartCount === 0) {
    return null; // Don't show counter when cart is empty
  }

  return (
    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1">
      {cartCount}
    </span>
  );
};

export default CartCounter;
