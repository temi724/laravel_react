import React from 'react';
import { InfoCircle, TickCircle, Warning2 } from 'iconsax-react';

const ALERTS = {
  error: { icon: Warning2, classes: 'border-sale/20 bg-sale-light text-sale' },
  success: { icon: TickCircle, classes: 'border-success/20 bg-success-light text-success' },
  warning: { icon: Warning2, classes: 'border-warning/20 bg-warning-light text-warning' },
  info: { icon: InfoCircle, classes: 'border-gray-200 bg-gray-50 text-gray-700' },
};

// Inline message that stays on the page, for form errors and results
export const Alert = ({ tone = 'info', title, children, className = '' }) => {
  const { icon: Icon, classes } = ALERTS[tone] || ALERTS.info;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${classes} ${className}`}>
      <Icon size={20} color="currentColor" variant="Linear" className="mt-px shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
    </div>
  );
};

// What to show when a list or section has nothing in it yet
export const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center text-center ${className}`}>
    {Icon && (
      <span className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <Icon size={24} color="currentColor" variant="Linear" />
      </span>
    )}
    <p className={`font-bold ${Icon ? 'mt-3' : ''}`}>{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-gray-600">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Skeleton = ({ className = '' }) => <span className={`block animate-pulse rounded-full bg-gray-100 ${className}`} aria-hidden="true" />;
