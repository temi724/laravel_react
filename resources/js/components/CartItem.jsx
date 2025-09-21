import React from 'react';

const CartItem = ({ item, onUpdateQuantity, onRemove, isLoading = false }) => {
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity <= 0) {
      onRemove(item.id);
    } else {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  const increaseQuantity = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const decreaseQuantity = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  return (
    <div className="flex items-center space-x-4 rounded-lg border border-gray-100 p-4">
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
        <p className="text-sm text-gray-500">₦{item.price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

        {item.selected_storage && (
          <p className="text-xs text-blue-600 mt-1">
            Storage: {item.selected_storage}
          </p>
        )}

        {item.selected_color && (
          <p className="text-xs text-green-600 mt-1">
            Color: {item.selected_color}
          </p>
        )}

        <div className="flex items-center space-x-2 mt-2">
          <button
            onClick={decreaseQuantity}
            className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || item.quantity <= 1}
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="w-16 text-center text-sm border border-gray-300 rounded px-2 py-1"
            disabled={isLoading}
          />
          <button
            onClick={increaseQuantity}
            className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            +
          </button>
        </div>
      </div>

      {/* Price and Remove */}
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          ₦{item.subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <button
          onClick={() => onRemove(item.id)}
          className="text-xs text-red-500 hover:text-red-700 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          Remove
        </button>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default CartItem;
