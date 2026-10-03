import React, { useEffect } from 'react';
import { ArrowRight, ShoppingCart, Trash } from 'iconsax-react';
import useCartStore from '../stores/cartStore';
import ProductImage from './ProductImage';
import QuantityStepper from './QuantityStepper';
import { formatPrice, productUrl } from '../lib/format';

const CartPage = () => {
  const { cartItems, cartTotal, cartCount, isLoading, updateQuantity, removeFromCart, clearCart, refreshCart, _hasHydrated } = useCartStore();

  useEffect(() => {
    // Try to manually rehydrate from persist
    if (useCartStore.persist && useCartStore.persist.rehydrate) {
      useCartStore.persist.rehydrate();
    }

    refreshCart();
  }, [refreshCart]);

  // Wait for hydration to complete before showing content
  if (!_hasHydrated) {
    return (
      <div className="grid animate-pulse grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]" aria-busy="true" aria-label="Loading cart">
        <div className="h-72 rounded-3xl bg-gray-200/70" />
        <div className="h-56 rounded-3xl bg-gray-200/70" />
      </div>
    );
  }

  const findItem = (itemIdentifier) => cartItems.find((item) => item.cartItemId === itemIdentifier || item.id === itemIdentifier);

  const changeQuantity = (itemIdentifier, change) => {
    const item = findItem(itemIdentifier);
    if (!item || item.quantity + change < 1) return;

    updateQuantity(itemIdentifier, item.quantity + change);

    // Track quantity change
    if (window.trackCheckoutEvent) {
      window.trackCheckoutEvent('cart_update', {
        product_id: item.product_id || item.id,
        product_name: item.product_name || item.name,
        old_quantity: item.quantity,
        new_quantity: item.quantity + change,
        value: item.price || item.subtotal / item.quantity,
      });
    }
  };

  const handleRemoveFromCart = (itemIdentifier) => {
    const item = findItem(itemIdentifier);

    if (item && window.trackCheckoutEvent) {
      window.trackCheckoutEvent('cart_remove', {
        product_id: item.product_id || item.id,
        product_name: item.product_name || item.name,
        quantity: item.quantity,
        value: item.subtotal || item.price,
      });
    }

    removeFromCart(itemIdentifier);
  };

  if (cartItems.length === 0) {
    return (
      <div className="panel mx-auto flex max-w-xl flex-col items-center px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <ShoppingCart size={28} color="currentColor" variant="Linear" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Your cart is empty</h1>
        <p className="mt-2 max-w-sm text-sm text-gray-600">Add a laptop, phone or gadget and it will show up here, ready for checkout.</p>
        <a href="/#products" className="btn btn-lg btn-primary mt-6">
          Browse products
          <ArrowRight size={18} color="currentColor" variant="Linear" />
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Your cart
          <span className="ml-3 text-base font-medium text-gray-500 tabular-nums">
            {cartCount} {cartCount === 1 ? 'item' : 'items'}
          </span>
        </h1>
        <button type="button" onClick={clearCart} disabled={isLoading} className="btn btn-outline h-9 px-4">
          <Trash size={16} color="currentColor" variant="Linear" />
          Clear cart
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* Cart items */}
        <ul className="panel divide-y divide-gray-100 px-4 sm:px-6">
          {cartItems.map((item, index) => {
            const identifier = item.cartItemId || item.id;
            const options = [item.selected_storage, item.selected_color, item.note].filter(Boolean).join(', ');
            const url = item.url || productUrl({ id: item.id, product_name: item.name });

            return (
              <li key={item.cartItemId || `${item.id}_${item.selected_storage || 'none'}_${index}`} className="flex gap-4 py-5">
                <a href={url} tabIndex={-1} aria-hidden="true">
                  <ProductImage src={item.image} className="size-20 rounded-2xl sm:size-24" iconSize={28} />
                </a>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-sm leading-5 font-semibold sm:text-base">
                        <a href={url} className="hover:text-brand">
                          {item.name}
                        </a>
                      </h2>
                      {options && <p className="mt-0.5 text-sm text-gray-500">{options}</p>}
                      <p className="mt-0.5 text-sm text-gray-500 tabular-nums">{formatPrice(item.price)} each</p>
                    </div>
                    <p className="shrink-0 text-base font-extrabold tracking-tight tabular-nums sm:text-lg">{formatPrice(item.subtotal)}</p>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <QuantityStepper
                      quantity={item.quantity}
                      label={item.name}
                      disabled={isLoading}
                      onDecrease={() => changeQuantity(identifier, -1)}
                      onIncrease={() => changeQuantity(identifier, 1)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(identifier)}
                      disabled={isLoading}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-sale-light hover:text-sale"
                    >
                      <Trash size={16} color="currentColor" variant="Linear" />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Order summary */}
        <aside className="panel p-5 sm:p-6 lg:sticky lg:top-36" aria-label="Order summary">
          <h2 className="text-lg font-bold">Order summary</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">
                Subtotal, {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </dt>
              <dd className="font-semibold tabular-nums">{formatPrice(cartTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Delivery</dt>
              <dd className="text-gray-600">Chosen at checkout</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-gray-200 pt-4">
              <dt className="text-base font-bold">Total</dt>
              <dd className="text-2xl font-extrabold tracking-tight tabular-nums">{formatPrice(cartTotal)}</dd>
            </div>
          </dl>

          <a
            href="/checkout"
            className="btn btn-lg btn-primary mt-6 w-full"
            onClick={() => {
              if (window.trackCheckoutEvent) {
                window.trackCheckoutEvent('checkout_start', {
                  cart_total: cartTotal,
                  cart_items: cartItems.length,
                  cart_value: cartItems.reduce((total, item) => total + (item.subtotal || item.price * item.quantity), 0),
                });
              }
            }}
          >
            Proceed to checkout
            <ArrowRight size={18} color="currentColor" variant="Linear" />
          </a>
          <a href="/#products" className="btn btn-lg btn-outline mt-2 w-full">
            Continue shopping
          </a>
        </aside>
      </div>
    </div>
  );
};

export default CartPage;
