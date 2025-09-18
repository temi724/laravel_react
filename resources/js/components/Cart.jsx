import React from 'react';
import useCartStore from '../stores/cartStore';

const Cart = () => {
  const {
    cartItems,
    isOpen,
    isLoading,
    closeCart,
    removeFromCart,
    updateQuantity,
  } = useCartStore();

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Slide-over panel */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
            <button
              onClick={closeCart}
              className="rounded-md p-2 text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.75781 16.2428L16.2431 7.75781" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.2431 16.2428L7.75781 7.75781" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cartItems.length > 0 ? (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.cartItemId || item.id} className="flex items-center space-x-4 rounded-lg border border-gray-100 p-4">
                    {/* Product Image */}
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-200">
                          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm text-gray-500">₦{item.price.toLocaleString()}</p>

                      {item.selected_storage && (
                        <p className="text-xs text-blue-600 mt-1">
                          Storage: {item.selected_storage}
                        </p>
                      )}

                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => handleQuantityChange(item.cartItemId || item.id, item.quantity - 1)}
                          className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                          disabled={isLoading}
                        >
                          -
                        </button>
                        <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.cartItemId || item.id, item.quantity + 1)}
                          className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                          disabled={isLoading}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price and Remove */}
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ₦{item.subtotal.toLocaleString()}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.cartItemId || item.id)}
                        className="text-xs text-red-500 hover:text-red-700 mt-1"
                        disabled={isLoading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-gray-500 text-lg font-medium mb-2">Your cart is empty</p>
                <p className="text-gray-400 text-sm">Add some products to get started</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total ({totalItems} items):</span>
                <span>₦{totalPrice.toLocaleString()}</span>
              </div>

              <div className="space-y-2">
                <a
                  href="/cart"
                  className="block w-full bg-gray-100 text-gray-800 text-center py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  View Cart
                </a>
                <a
                  href="/checkout"
                  className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Checkout
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
