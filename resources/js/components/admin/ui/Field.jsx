import React, { useId } from 'react';

// Label above, helper text and error below. The control is passed as children and receives the id.
export const Field = ({ label, hint, error, required = false, optional = false, className = '', children }) => {
  const id = useId();
  const message = Array.isArray(error) ? error[0] : error;
  const describedBy = message ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
          {required && <span className="ml-0.5 text-sale" aria-hidden="true">*</span>}
          {optional && <span className="ml-1 font-normal text-gray-500">(optional)</span>}
        </label>
      )}
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { id, 'aria-invalid': Boolean(message) || undefined, 'aria-describedby': describedBy, invalid: Boolean(message) })
          : child
      )}
      {message ? (
        <p id={`${id}-error`} className="text-sm text-sale">
          {message}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-gray-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
};

const controlClass = (size, invalid, className) => `field ${size === 'sm' ? 'field-sm' : ''} ${invalid ? 'field-error' : ''} ${className}`;

// `ref` reaches the real input, for screens that need to focus it
export const Input = ({ size = 'md', invalid = false, className = '', prefix, ref, ...props }) => {
  if (!prefix) return <input ref={ref} className={controlClass(size, invalid, className)} {...props} />;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm text-gray-500">{prefix}</span>
      <input ref={ref} className={`${controlClass(size, invalid, className)} pl-9`} {...props} />
    </div>
  );
};

export const Select = ({ size = 'md', invalid = false, className = '', children, ...props }) => (
  <select className={controlClass(size, invalid, className)} {...props}>
    {children}
  </select>
);

export const Textarea = ({ invalid = false, className = '', rows = 3, ...props }) => (
  <textarea rows={rows} className={controlClass('md', invalid, className)} {...props} />
);

// Tick box with its label. Use it to pick several things from a list.
export const Checkbox = ({ checked, onChange, label, disabled = false, className = '' }) => (
  <label className={`flex cursor-pointer items-center gap-2.5 text-sm ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="size-[18px] shrink-0 cursor-pointer rounded accent-brand" />
    <span className="min-w-0">{label}</span>
  </label>
);

// On/off switch with its label. Use it for a single yes/no setting.
export const Switch = ({ checked, onChange, label, description, disabled = false }) => (
  <label className={`flex cursor-pointer items-start gap-3 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
    <span className="relative mt-0.5 inline-flex shrink-0">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="peer sr-only" />
      <span className="h-6 w-11 rounded-full bg-gray-300 transition-colors duration-200 ease-out peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand" />
      <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform duration-200 ease-out peer-checked:translate-x-5" />
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-semibold">{label}</span>
      {description && <span className="mt-0.5 block text-xs text-gray-500">{description}</span>}
    </span>
  </label>
);

export default Field;
