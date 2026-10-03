import React from 'react';
import { Add, Minus } from 'iconsax-react';

// Pill stepper used in the cart drawer and on the cart page
const QuantityStepper = ({ quantity, onDecrease, onIncrease, label = 'item', disabled = false }) => (
  <div className="inline-flex h-9 items-center rounded-full border border-gray-300 bg-white" role="group" aria-label={`Quantity of ${label}`}>
    <button
      type="button"
      onClick={onDecrease}
      disabled={disabled || quantity <= 1}
      aria-label={`Decrease quantity of ${label}`}
      className="flex size-9 items-center justify-center rounded-full text-ink transition-[transform,background-color] duration-200 ease-out hover:bg-gray-100 active:scale-[0.94] disabled:pointer-events-none disabled:text-gray-300"
    >
      <Minus size={16} color="currentColor" variant="Linear" />
    </button>
    <span className="min-w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
      {quantity}
    </span>
    <button
      type="button"
      onClick={onIncrease}
      disabled={disabled}
      aria-label={`Increase quantity of ${label}`}
      className="flex size-9 items-center justify-center rounded-full text-ink transition-[transform,background-color] duration-200 ease-out hover:bg-gray-100 active:scale-[0.94] disabled:pointer-events-none disabled:text-gray-300"
    >
      <Add size={16} color="currentColor" variant="Linear" />
    </button>
  </div>
);

export default QuantityStepper;
