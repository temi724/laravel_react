import React, { useEffect } from 'react';
import useCartStore from '../stores/cartStore';

const CartPage = () => {
  const {
    cartItems,
    cartTotal,
    cartCount,
    isLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    _hasHydrated,
  } = useCartStore();

  useEffect(() => {
    console.log('CartPage mounted - cart state:', {
      cartItems,
      cartTotal,
      cartCount,
      _hasHydrated,
      itemsLength: cartItems?.length || 0
    });

    // Try to manually rehydrate from persist
    if (useCartStore.persist && useCartStore.persist.rehydrate) {
      console.log('Manually triggering cart rehydration');
      useCartStore.persist.rehydrate();
    }

    refreshCart();
  }, [refreshCart]);

  // Log whenever cartItems change
  useEffect(() => {
    console.log('CartPage - cartItems changed:', {
      cartItems,
      length: cartItems?.length || 0,
      hasHydrated: _hasHydrated
    });
  }, [cartItems, _hasHydrated]);

  // Wait for hydration to complete before showing content
  if (!_hasHydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (itemIdentifier, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemIdentifier);
    } else {
      updateQuantity(itemIdentifier, newQuantity);
    }
  };

  const increaseQuantity = (itemIdentifier) => {
    const item = cartItems.find(item =>
      item.cartItemId === itemIdentifier || item.id === itemIdentifier
    );
    if (item) {
      updateQuantity(itemIdentifier, item.quantity + 1);
    }
  };

  const decreaseQuantity = (itemIdentifier) => {
    const item = cartItems.find(item =>
      item.cartItemId === itemIdentifier || item.id === itemIdentifier
    );
    if (item && item.quantity > 1) {
      updateQuantity(itemIdentifier, item.quantity - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6 mb-6 space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Shopping Cart</h1>
          {cartItems.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 mt-2 sm:mt-0 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 w-fit">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </span>
          )}
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={clearCart}
            className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors w-fit"
            disabled={isLoading}
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Clear Cart</span>
            <span className="sm:hidden">Clear</span>
          </button>
        )}
      </div>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">

          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-2">
              {cartItems.map((item, index) => (
                <div key={item.cartItemId || `${item.id}_${item.selected_storage || 'none'}_${index}`} className="bg-white rounded-md border border-gray-200 p-2 sm:p-3 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    {/* Product Image */}
                    <div className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 rounded-md bg-gray-100 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-md bg-gray-100">
                          <svg className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5 line-clamp-2">{item.name}</h3>
                        <p className="text-xs text-gray-600 font-medium">₦{item.price.toLocaleString()}</p>
                      </div>
                      {item.selected_storage && (
                        <div>
                          <span className="inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            {item.selected_storage}
                          </span>
                        </div>
                      )}

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <span className="text-xs font-medium text-gray-700">Qty:</span>
                        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                          <button
                            onClick={() => decreaseQuantity(item.cartItemId || item.id)}
                            className="h-6 w-6 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={isLoading || item.quantity <= 1}
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.cartItemId || item.id, parseInt(e.target.value) || 1)}
                            className="w-10 text-center border-l border-r border-gray-300 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium"
                            disabled={isLoading}
                          />
                          <button
                            onClick={() => increaseQuantity(item.cartItemId || item.id)}
                            className="h-6 w-6 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={isLoading}
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="text-right space-y-1 sm:space-y-2">
                      <div>
                        <p className="text-sm sm:text-base font-bold text-gray-900">
                          ₦{item.subtotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.cartItemId || item.id)}
                        className="inline-flex items-center px-1.5 sm:px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded transition-colors"
                        disabled={isLoading}
                      >
                        <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Remove</span>
                        <span className="sm:hidden">×</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-md border border-gray-200 p-4 shadow-xs sticky top-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                  <span className="font-medium text-gray-900">₦{cartTotal.toLocaleString()}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">₦{cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <a
                  href="/checkout"
                  className="block w-full bg-blue-600 text-white text-center py-2.5 px-4 rounded-md font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                >
                  Proceed to Checkout
                </a>
                <a
                  href="/"
                  className="block w-full bg-gray-100 text-gray-800 text-center py-2 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors border border-gray-200 text-sm"
                >
                  Continue Shopping
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8 text-lg">Looks like you haven't added any items to your cart yet. Start exploring our products!</p>
            <a
              href="/"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Start Shopping
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
