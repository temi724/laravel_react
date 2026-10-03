import React, { useEffect, useRef } from 'react';
import { Add, ArrowRight, Bank, Copy, Shop, ShoppingCart, TickCircle, TruckFast, Whatsapp } from 'iconsax-react';
import useCheckoutStore from '../stores/checkoutStore';
import ProductImage from './ProductImage';
import { formatPrice } from '../lib/format';
import store from '../lib/store';

// Keeps digits and one leading plus, so letters can never be typed or pasted into the phone field
const sanitizePhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 15);
  return value.trim().startsWith('+') ? `+${digits}` : digits;
};

const InputField = ({ id, label, type = 'text', value, onChange, required = false, placeholder = '', autoComplete, inputMode, errors = {} }) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="text-sm font-semibold">
      {label}
      {!required && <span className="ml-1 font-normal text-gray-500">(optional)</span>}
    </label>
    <input
      type={type}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      aria-invalid={Boolean(errors[id])}
      aria-describedby={errors[id] ? `${id}-error` : undefined}
      className={`field ${errors[id] ? 'field-error' : ''}`}
      required={required}
    />
    {errors[id] && (
      <p id={`${id}-error`} className="text-sm text-sale">
        {errors[id]}
      </p>
    )}
  </div>
);

const DeliveryOption = ({ value, checked, onChange, icon: Icon, title, description }) => (
  <label
    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
      checked ? 'border-brand bg-brand-light' : 'border-gray-200 bg-white hover:border-gray-400'
    }`}
  >
    <input type="radio" name="delivery" value={value} checked={checked} onChange={(e) => onChange(e.target.value)} className="sr-only" />
    <Icon size={22} color="currentColor" variant="Linear" className={`mt-0.5 shrink-0 ${checked ? 'text-brand' : 'text-gray-500'}`} />
    <span className="min-w-0 flex-1">
      <span className={`block text-sm font-bold ${checked ? 'text-brand' : ''}`}>{title}</span>
      <span className="mt-0.5 block text-sm text-gray-600">{description}</span>
    </span>
    <span
      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${checked ? 'border-brand bg-brand' : 'border-gray-300 bg-white'}`}
      aria-hidden="true"
    >
      {checked && <span className="size-2 rounded-full bg-white" />}
    </span>
  </label>
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
    showPaymentModal,
    closeBankModal,
    completeOrder,
    showToast,
    initialize,
  } = useCheckoutStore();

  const details = store();
  const modalRef = useRef(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // While the transfer details are open: Escape closes them and the page behind does not scroll
  useEffect(() => {
    if (!showBankModal) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeBankModal();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    modalRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showBankModal, closeBankModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = showPaymentModal();

    if (result.success) {
      // Track payment info event
      if (window.trackCheckoutEvent) {
        window.trackCheckoutEvent('payment_info', {
          payment_method: paymentMethod,
          delivery_option: deliveryOption,
          cart_total: cartTotal,
          cart_items: cartItems.length,
          order_id: generatedOrderId,
        });
      }
      // Payment modal is now shown with generated order ID
      // No API call made yet - that happens when the customer confirms the order
    }
  };

  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    showToast(message, 'success');
  };

  if (cartItems.length === 0 && !isLoading) {
    return (
      <div className="panel mx-auto flex max-w-xl flex-col items-center px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <ShoppingCart size={28} color="currentColor" variant="Linear" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Your cart is empty</h1>
        <p className="mt-2 max-w-sm text-sm text-gray-600">Add some items to your cart before proceeding to checkout.</p>
        <a href="/#products" className="btn btn-lg btn-primary mt-6">
          Browse products
          <ArrowRight size={18} color="currentColor" variant="Linear" />
        </a>
      </div>
    );
  }

  const whatsappProofUrl = `https://wa.me/${details.whatsapp}?text=${encodeURIComponent(`Payment Proof for Order ID: ${generatedOrderId}`)}`;

  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight sm:text-3xl">Checkout</h1>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_400px]">
        {/* Order form */}
        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Customer information */}
          <section className="panel p-5 sm:p-6">
            <h2 className="text-lg font-bold">Your details</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                id="username"
                label="Full name"
                value={username}
                onChange={(value) => setFormField('username', value)}
                placeholder="Adaeze Okonkwo"
                autoComplete="name"
                required
                errors={errors}
              />

              <InputField
                id="phone"
                label="Phone number"
                type="tel"
                value={phone}
                onChange={(value) => setFormField('phone', sanitizePhone(value))}
                placeholder="08030000000"
                autoComplete="tel"
                inputMode="tel"
                required
                errors={errors}
              />

              <div className="md:col-span-2">
                <InputField
                  id="email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(value) => setFormField('email', value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  errors={errors}
                />
              </div>
            </div>
          </section>

          {/* Delivery options */}
          <section className="panel p-5 sm:p-6">
            <h2 className="text-lg font-bold">Pickup or delivery</h2>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" role="radiogroup" aria-label="Pickup or delivery">
              <DeliveryOption
                value="pickup"
                checked={deliveryOption === 'pickup'}
                onChange={(value) => setFormField('deliveryOption', value)}
                icon={Shop}
                title="Store pickup"
                description="Pick up your order from our store"
              />
              <DeliveryOption
                value="delivery"
                checked={deliveryOption === 'delivery'}
                onChange={(value) => setFormField('deliveryOption', value)}
                icon={TruckFast}
                title="Home delivery"
                description="We'll deliver to your address"
              />
            </div>

            {/* Store address for pickup */}
            {deliveryOption === 'pickup' && (
              <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 rounded-2xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">Pickup location</dt>
                  <dd className="mt-0.5 font-semibold">
                    {details.legal_name}
                    <br />
                    {details.address.line}
                    <br />
                    {details.address.area}
                  </dd>
                </div>
                <div className="space-y-3">
                  <div>
                    <dt className="text-gray-500">Hours</dt>
                    <dd className="mt-0.5 font-semibold">{details.hours}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="mt-0.5 font-semibold">
                      <a href={`tel:${details.phone}`} className="hover:text-brand">
                        {details.phone_display}
                      </a>
                    </dd>
                  </div>
                </div>
              </dl>
            )}

            {/* Delivery address fields */}
            {deliveryOption === 'delivery' && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <InputField
                    id="location"
                    label="Delivery address"
                    value={location}
                    onChange={(value) => setFormField('location', value)}
                    placeholder="House number and street"
                    autoComplete="street-address"
                    required
                    errors={errors}
                  />
                </div>

                <InputField
                  id="city"
                  label="City"
                  value={city}
                  onChange={(value) => setFormField('city', value)}
                  placeholder="Ikeja"
                  autoComplete="address-level2"
                  required
                  errors={errors}
                />

                <InputField
                  id="state"
                  label="State"
                  value={state}
                  onChange={(value) => setFormField('state', value)}
                  placeholder="Lagos"
                  autoComplete="address-level1"
                  required
                  errors={errors}
                />
              </div>
            )}
          </section>

          {/* Payment method */}
          <section className="panel p-5 sm:p-6">
            <h2 className="text-lg font-bold">Payment</h2>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-brand bg-brand-light p-4">
              <Bank size={22} color="currentColor" variant="Linear" className="mt-0.5 shrink-0 text-brand" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-brand">Bank transfer</p>
                <p className="mt-0.5 text-sm text-gray-600">You will see our account details in the next step.</p>
              </div>
              <TickCircle size={22} color="currentColor" variant="Bold" className="shrink-0 text-brand" />
            </div>
          </section>
        </form>

        {/* Order summary */}
        <aside className="panel p-5 sm:p-6 lg:sticky lg:top-36" aria-label="Order summary">
          <h2 className="text-lg font-bold">Order summary</h2>

          {/* Cart items */}
          <ul className="mt-4 space-y-4">
            {cartItems.map((item) => (
              <li key={item.cartItemId || item.id} className="flex items-center gap-3">
                <ProductImage src={item.image} className="size-14 rounded-xl" iconSize={20} />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium">{item.name}</h3>
                  <p className="truncate text-xs text-gray-500">
                    Qty {item.quantity}
                    {item.selected_storage ? `, ${item.selected_storage}` : ''}
                    {item.selected_color ? `, ${item.selected_color}` : ''}
                    {item.note ? `, ${item.note}` : ''}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(item.subtotal)}</p>
              </li>
            ))}
          </ul>

          {/* Order total */}
          <dl className="mt-5 space-y-3 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">
                Subtotal, {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </dt>
              <dd className="font-semibold tabular-nums">{formatPrice(cartTotal)}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-gray-600">{deliveryOption === 'delivery' ? 'Delivery fee' : 'Store pickup'}</dt>
              <dd className="text-gray-600">{deliveryOption === 'delivery' ? 'Agreed with the rider' : 'Free'}</dd>
            </div>

            <div className="flex items-baseline justify-between border-t border-gray-200 pt-4">
              <dt className="text-base font-bold">Total</dt>
              <dd className="text-2xl font-extrabold tracking-tight tabular-nums">{formatPrice(cartTotal)}</dd>
            </div>
          </dl>

          {deliveryOption === 'delivery' && (
            <p className="mt-3 text-xs leading-relaxed text-gray-600">
              The delivery fee is not included. It can be negotiated with the rider based on your location.
            </p>
          )}

          {/* Submit button */}
          <button type="submit" form="checkout-form" disabled={isLoading} className="btn btn-lg btn-primary mt-6 w-full">
            {isLoading ? 'Processing order' : 'Place order'}
            {!isLoading && <ArrowRight size={18} color="currentColor" variant="Linear" />}
          </button>
        </aside>
      </div>

      {/* Bank transfer details */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/50 sm:items-center sm:p-4">
          <div className="absolute inset-0" onClick={closeBankModal} aria-hidden="true" />

          <div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bank-modal-title"
            className="relative max-h-[92dvh] w-full max-w-md animate-rise overflow-y-auto rounded-t-3xl bg-white p-5 outline-none sm:rounded-3xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="bank-modal-title" className="text-xl font-extrabold tracking-tight">
                  Pay by bank transfer
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Order <span className="font-semibold text-ink">{generatedOrderId}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeBankModal}
                aria-label="Close"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink"
              >
                <Add size={24} color="currentColor" variant="Linear" className="rotate-45" />
              </button>
            </div>

            {/* Account to pay into */}
            <div className="mt-5 rounded-3xl bg-ink p-5 text-white">
              <p className="text-sm text-white/60">{details.bank.bank_name}</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-3xl font-extrabold tracking-tight tabular-nums">{details.bank.account_number}</p>
                <button
                  type="button"
                  onClick={() => copyText(details.bank.account_number, 'Account number copied')}
                  className="btn h-9 bg-white px-4 text-ink hover:bg-gray-100"
                >
                  <Copy size={16} color="currentColor" variant="Linear" />
                  Copy
                </button>
              </div>
              <p className="mt-1 text-sm font-medium">{details.bank.account_name}</p>

              <div className="mt-5 flex items-baseline justify-between border-t border-white/10 pt-4">
                <span className="text-sm text-white/60">Amount to send</span>
                <span className="text-xl font-extrabold tracking-tight tabular-nums">{formatPrice(cartTotal)}</span>
              </div>
            </div>

            {/* What to do */}
            <ol className="mt-5 space-y-3 text-sm">
              {[
                'Transfer the amount to the account above.',
                `Put your order ID, ${generatedOrderId}, in the transfer description.`,
                'Send your proof of payment on WhatsApp.',
              ].map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold tabular-nums">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-gray-700">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-6 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={async () => {
                  const result = await completeOrder();
                  if (result.success) {
                    window.location.href = '/checkout/success';
                  }
                  // If failed, stay on modal to allow retry
                }}
                disabled={isLoading}
                className="btn btn-lg btn-primary w-full"
              >
                {isLoading ? (
                  <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent [animation-duration:600ms]" aria-hidden="true" />
                ) : (
                  <TickCircle size={20} color="currentColor" variant="Linear" />
                )}
                {isLoading ? 'Confirming order' : 'Confirm order'}
              </button>

              <a href={whatsappProofUrl} target="_blank" rel="noopener noreferrer" className="btn btn-lg btn-outline w-full">
                <Whatsapp size={20} color="currentColor" variant="Linear" />
                Send proof on WhatsApp
              </a>

              <button
                type="button"
                onClick={() =>
                  copyText(
                    `Account Name: ${details.bank.account_name}\nBank: ${details.bank.bank_name}\nAccount Number: ${details.bank.account_number}`,
                    'Account details copied'
                  )
                }
                className="btn w-full text-gray-600 hover:text-ink"
              >
                <Copy size={16} color="currentColor" variant="Linear" />
                Copy all account details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
