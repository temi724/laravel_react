import React, { useEffect, useRef } from 'react';
import { Add, ArrowRight, ShoppingCart, Trash } from 'iconsax-react';
import useCartStore from '../stores/cartStore';
import ProductImage from './ProductImage';
import QuantityStepper from './QuantityStepper';
import { formatPrice } from '../lib/format';

// Cart drawer. It stays mounted so it can slide in and out; while closed it is
// inert, so it cannot be focused or clicked.
const Cart = () => {
  const { cartItems, isOpen, isLoading, closeCart, removeFromCart, updateQuantity } = useCartStore();
  const closeButtonRef = useRef(null);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeCart();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, closeCart]);

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`} inert={!isOpen}>
      {/* Background overlay */}
      <div
        className={`absolute inset-0 bg-ink/50 transition-opacity duration-200 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeCart}
      />

      {/* Slide-over panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white transition-transform duration-300 ease-drawer motion-reduce:transition-none sm:rounded-l-3xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-bold">
            Your cart
            {totalItems > 0 && <span className="ml-2 text-sm font-medium text-gray-500 tabular-nums">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex size-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink"
          >
            <Add size={24} color="currentColor" variant="Linear" className="rotate-45" />
          </button>
        </div>

        {cartItems.length > 0 ? (
          <>
            {/* Cart Items */}
            <ul className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {cartItems.map((item) => {
                const identifier = item.cartItemId || item.id;
                const options = [item.selected_storage, item.selected_color, item.note].filter(Boolean).join(', ');

                return (
                  <li key={identifier} className="flex gap-3">
                    <ProductImage src={item.image} className="size-20 rounded-2xl" iconSize={24} />

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-sm leading-5 font-medium">{item.name}</h3>
                        <p className="shrink-0 text-sm font-bold tabular-nums">{formatPrice(item.subtotal)}</p>
                      </div>
                      {options && <p className="mt-0.5 truncate text-xs text-gray-500">{options}</p>}

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <QuantityStepper
                          quantity={item.quantity}
                          label={item.name}
                          disabled={isLoading}
                          onDecrease={() => updateQuantity(identifier, item.quantity - 1)}
                          onIncrease={() => updateQuantity(identifier, item.quantity + 1)}
                        />
                        <button
                          type="button"
                          onClick={() => removeFromCart(identifier)}
                          disabled={isLoading}
                          aria-label={`Remove ${item.name} from cart`}
                          className="flex size-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-sale-light hover:text-sale"
                        >
                          <Trash size={18} color="currentColor" variant="Linear" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Footer */}
            <div className="border-t border-gray-200 px-5 pt-4 pb-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-xl font-extrabold tracking-tight tabular-nums">{formatPrice(totalPrice)}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Delivery fee is not included. It is agreed with the rider.</p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href="/cart" className="btn btn-lg btn-outline">
                  View cart
                </a>
                <a href="/checkout" className="btn btn-lg btn-primary">
                  Checkout
                  <ArrowRight size={18} color="currentColor" variant="Linear" />
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <ShoppingCart size={28} color="currentColor" variant="Linear" />
            </span>
            <p className="mt-5 text-lg font-bold">Your cart is empty</p>
            <p className="mt-1 text-sm text-gray-600">Items you add will show up here.</p>
            <a href="/#products" onClick={closeCart} className="btn btn-primary mt-6">
              Browse products
            </a>
          </div>
        )}
      </aside>
    </div>
  );
};

export default Cart;
