import React from 'react';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-outline',
  ink: 'btn-ink',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

const Spinner = ({ className = '' }) => (
  <span
    className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent [animation-duration:600ms] ${className}`}
    aria-hidden="true"
  />
);

// The one button for the admin. Renders a link when `href` is given.
// `icon` is an iconsax component; `loading` swaps it for a spinner and disables the button.
const Button = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  href,
  type = 'button',
  className = '',
  children,
  ...props
}) => {
  const iconSize = size === 'sm' ? 16 : 18;
  const classes = `btn ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || ''} ${className}`;
  const content = (
    <>
      {loading ? <Spinner /> : Icon && <Icon size={iconSize} color="currentColor" variant="Linear" />}
      {children}
      {IconRight && !loading && <IconRight size={iconSize} color="currentColor" variant="Linear" />}
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} disabled={disabled || loading} className={classes} {...props}>
      {content}
    </button>
  );
};

const ICON_TONES = {
  neutral: 'text-gray-500 hover:bg-gray-100 hover:text-ink',
  brand: 'text-brand hover:bg-brand-light',
  success: 'text-success hover:bg-success-light',
  danger: 'text-gray-500 hover:bg-sale-light hover:text-sale',
};

// Round icon-only button. `label` is required: it is the accessible name and the tooltip.
export const IconButton = ({ icon: Icon, label, tone = 'neutral', size = 36, className = '', ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`flex shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color] duration-200 ease-out active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40 ${ICON_TONES[tone] || ICON_TONES.neutral} ${className}`}
    style={{ width: size, height: size }}
    {...props}
  >
    <Icon size={18} color="currentColor" variant="Linear" />
  </button>
);

export { Spinner };
export default Button;
