import React, { useEffect } from 'react';
import useCartStore from '../stores/cartStore';

const CartDebug = () => {
  const {
    cartItems,
    cartTotal,
    cartCount,
    isOpen,
    _hasHydrated,
    addToCart,
    openCart,
  } = useCartStore();

  useEffect(() => {
    console.log('Cart Debug - Current state:', {
      cartItems,
      cartTotal,
      cartCount,
      isOpen,
      _hasHydrated,
      itemsLength: cartItems?.length || 0,
    });

    // Check localStorage directly
    const storedCart = localStorage.getItem('cart-storage');
    console.log('Cart Debug - localStorage cart-storage:', storedCart);
    if (storedCart) {
      try {
        const parsed = JSON.parse(storedCart);
        console.log('Cart Debug - Parsed localStorage:', parsed);
      } catch (e) {
        console.log('Cart Debug - Error parsing localStorage:', e);
      }
    }
  }, [cartItems, cartTotal, cartCount, isOpen, _hasHydrated]);

  return (
    <div className="fixed bottom-4 left-4 bg-yellow-100 border border-yellow-400 rounded p-4 text-sm z-50 max-w-xs">
      <h4 className="font-bold text-yellow-800">Cart Debug</h4>
      <div className="text-yellow-700">
        <p>Items: {cartItems?.length || 0}</p>
        <p>Total: ₦{cartTotal || 0}</p>
        <p>Count: {cartCount || 0}</p>
        <p>Open: {isOpen ? 'Yes' : 'No'}</p>
        <p>Hydrated: {_hasHydrated ? 'Yes' : 'No'}</p>
        <button
          onClick={() => {
            const stored = localStorage.getItem('cart-storage');
            console.log('Manual localStorage check:', stored);
          }}
          className="mt-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs mr-2"
        >
          Check Storage
        </button>
        <button
          onClick={async () => {
            const testProductId = '68ca5dc00069233800b9a0ed'; // Use valid UUID from database
            console.log('Testing addToCart with product ID:', testProductId);
            try {
              await addToCart(testProductId, 1, 'product');
              console.log('Test add to cart completed successfully');
            } catch (error) {
              console.error('Test add to cart failed:', error);
            }
          }}
          className="mt-2 bg-green-500 text-white px-2 py-1 rounded text-xs mr-2"
        >
          Test Add
        </button>
        <button
          onClick={() => openCart()}
          className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Open Cart
        </button>
      </div>
    </div>
  );
};

export default CartDebug;
