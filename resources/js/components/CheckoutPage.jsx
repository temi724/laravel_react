import React, { useEffect, useState } from 'react';
import useCheckoutStore from '../stores/checkoutStore';

const InputField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder = '',
  options = null,
  errors = {}
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {options ? (
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          errors[id] ? 'border-red-300' : 'border-gray-300'
        }`}
        required={required}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          errors[id] ? 'border-red-300' : 'border-gray-300'
        }`}
        required={required}
      />
    )}
    {errors[id] && (
      <p className="mt-1 text-sm text-red-600">{errors[id]}</p>
    )}
  </div>
);

const CheckoutPage = () => {
  const {
    cartItems,
    cartTotal,
    cartCount,
    username,
    email,
    deliveryOption,
    location,
    city,
    state,
    phone,
    paymentMethod,
    showBankModal,
    isLoading,
    errors,
    generatedOrderId,
    setFormField,
    updateStorageOption,
    placeOrder,
    openBankModal,
    closeBankModal,
    completeOrder,
    showToast,
    initialize,
  } = useCheckoutStore();

  const [availableStorageOptions] = useState({
    '64GB': 150000,
    '128GB': 200000,
    '256GB': 300000,
    '512GB': 450000,
    '1TB': 600000,
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await placeOrder();

    if (result.success) {
      // Bank modal will be shown automatically via showBankModal state
      // No redirect needed here since modal handles the flow
    }
  };

  const handleStorageChange = (itemId, storageOption) => {
    const storagePrice = availableStorageOptions[storageOption];
    updateStorageOption(itemId, storageOption, storagePrice);
  };

  // Copy functions for bank details
  const copyAccountDetails = async () => {
    const accountDetails = `Account Name: Murphylog Global Concept
Bank: Providus Bank
Account Number: 5401799184`;

    try {
      await navigator.clipboard.writeText(accountDetails);
      showToast('Account details copied to clipboard!', 'success');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = accountDetails;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Account details copied to clipboard!', 'success');
    }
  };

  const copyWhatsAppNumber = async () => {
    const whatsappNumber = '+234 802 491 3553';

    try {
      await navigator.clipboard.writeText(whatsappNumber);
      showToast('WhatsApp number copied to clipboard!', 'success');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = whatsappNumber;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('WhatsApp number copied to clipboard!', 'success');
    }
  };

  const copyAccountNumber = async () => {
    const accountNumber = '5401799184';

    try {
      await navigator.clipboard.writeText(accountNumber);
      showToast('Account number copied to clipboard!', 'success');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = accountNumber;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Account number copied to clipboard!', 'success');
    }
  };

  if (cartItems.length === 0 && !isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-24 w-24 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add some items to your cart before proceeding to checkout.</p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Checkout</h1>
        <p className="text-gray-600 mt-1">Complete your order securely</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Order Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  id="username"
                  label="Full Name"
                  value={username}
                  onChange={(value) => setFormField('username', value)}
                  placeholder="Enter your full name"
                  required
                  errors={errors}
                />

                <InputField
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(value) => setFormField('email', value)}
                  placeholder="your@email.com"
                  required
                  errors={errors}
                />

                <InputField
                  id="phone"
                  label="Phone Number"
                  type="tel"
                  value={phone}
                  onChange={(value) => setFormField('phone', value)}
                  placeholder="+234 XXX XXX XXXX"
                  required
                  errors={errors}
                />
              </div>
            </div>

            {/* Delivery Options */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Options</h2>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="pickup"
                    name="delivery"
                    value="pickup"
                    checked={deliveryOption === 'pickup'}
                    onChange={(e) => setFormField('deliveryOption', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="pickup" className="flex-1">
                    <div className="font-medium text-gray-900">Store Pickup</div>
                    <div className="text-sm text-gray-600">Pick up your order from our store</div>
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="delivery"
                    name="delivery"
                    value="delivery"
                    checked={deliveryOption === 'delivery'}
                    onChange={(e) => setFormField('deliveryOption', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="delivery" className="flex-1">
                    <div className="font-medium text-gray-900">Home Delivery</div>
                    <div className="text-sm text-gray-600">We'll deliver to your address</div>
                  </label>
                </div>
              </div>

              {/* Store Address for Pickup */}
              {deliveryOption === 'pickup' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Pickup Location</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p className="font-medium">Gadget Store MMM</p>
                    <p>123 Technology Street, Computer Village</p>
                    <p>Ikeja, Lagos State, Nigeria</p>
                    <p className="mt-2">
                      <span className="font-medium">Hours:</span> Mon-Sat 9:00 AM - 7:00 PM
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span> +234 801 234 5678
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery Address Fields */}
              {deliveryOption === 'delivery' && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <InputField
                      id="location"
                      label="Delivery Address"
                      value={location}
                      onChange={(value) => setFormField('location', value)}
                      placeholder="Enter your delivery address"
                      required
                      errors={errors}
                    />
                  </div>

                  <InputField
                    id="city"
                    label="City"
                    value={city}
                    onChange={(value) => setFormField('city', value)}
                    placeholder="Enter your city"
                    required
                    errors={errors}
                  />

                  <InputField
                    id="state"
                    label="State"
                    value={state}
                    onChange={(value) => setFormField('state', value)}
                    placeholder="Enter your state"
                    required
                    errors={errors}
                  />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">Bank Transfer</h3>
                    <p className="text-xs text-blue-700">Secure bank transfer payment</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isLoading ? 'Processing Order...' : 'Place Order'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-gray-900 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>

                    {item.selected_storage && (
                      <div className="mt-1">
                        <select
                          value={item.selected_storage}
                          onChange={(e) => handleStorageChange(item.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-1 py-0.5"
                        >
                          {Object.entries(availableStorageOptions).map(([storage, price]) => (
                            <option key={storage} value={storage}>
                              {storage} - ₦{price.toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-900">
                      ₦{item.subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex justify-between text-xs">
                <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                <span>₦{cartTotal.toLocaleString()}</span>
              </div>

              {deliveryOption === 'delivery' && (
                <div className="flex justify-between text-xs">
                  <span>Delivery Fee</span>
                  <span className="text-orange-600">Negotiable</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-semibold border-t pt-2">
                <span>Total</span>
                <span>₦{cartTotal.toLocaleString()}{deliveryOption === 'delivery' ? ' + delivery' : ''}</span>
              </div>

              {deliveryOption === 'delivery' && (
                <p className="text-xs text-orange-600 mt-2">
                  * Delivery fee can be negotiated with the rider based on your location
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bank Transfer Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(5px)'}}>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold">Bank Transfer Details</h3>
                  </div>
                  <button onClick={closeBankModal} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Order ID */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span className="text-sm font-semibold text-blue-800">Order ID:</span>
                    <span className="text-sm font-bold text-blue-900 ml-2">{generatedOrderId}</span>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    Transfer To:
                  </h4>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Account Name:</span>
                      <span className="text-sm font-bold text-gray-900">Murphylog Global Concept</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Bank:</span>
                      <span className="text-sm font-bold text-gray-900">Providus Bank</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Account Number:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900">5401799184</span>
                        <button
                          onClick={copyAccountNumber}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Copy account number">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Copy All Account Details Button */}
                    <div className="mt-3">
                      <button
                        onClick={copyAccountDetails}
                        className="flex items-center justify-center w-full py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-300">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        Copy All Account Details
                      </button>
                    </div>

                    <div className="flex justify-between pt-2">
                      <span className="text-base font-bold text-gray-900">Amount:</span>
                      <span className="text-lg font-bold text-green-600">₦{cartTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-yellow-50 rounded-xl p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <h5 className="font-bold text-yellow-800 mb-2">Important Instructions:</h5>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Make the transfer to the account details above</li>
                        <li>• Include your Order ID in the transfer description</li>
                        <li>• Send proof of payment via WhatsApp</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Contact Options */}
                <div className="bg-green-50 rounded-xl p-4">
                  <h5 className="font-bold text-green-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    Send Proof of Payment:
                  </h5>
                  <div className="space-y-2">
                    <a href={`https://wa.me/2348024913553?text=Payment%20Proof%20for%20Order%20ID:%20${generatedOrderId}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center p-3 bg-white rounded-lg hover:shadow-md transition-all duration-300">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.785"/>
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900">WhatsApp</span>
                        <p className="text-xs text-gray-600">+234 802 491 3553</p>
                      </div>
                    </a>

                    {/* Copy WhatsApp Number Button */}
                    <button
                      onClick={copyWhatsAppNumber}
                      className="flex items-center justify-center w-full py-2 px-3 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-all duration-300">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                      </svg>
                      Copy WhatsApp Number
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 rounded-b-3xl">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      completeOrder();
                      window.location.href = '/checkout/success';
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg">
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                      </svg>
                      Continue
                    </span>
                  </button>
                  <button
                    onClick={closeBankModal}
                    className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-xl transition-all duration-300">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your order...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
