import React from 'react';

// White surface with a hairline border. `padded` adds the standard inner spacing.
const Card = ({ as: Tag = 'section', padded = true, className = '', children, ...props }) => (
  <Tag className={`rounded-2xl border border-gray-200 bg-white ${padded ? 'p-5 sm:p-6' : ''} ${className}`} {...props}>
    {children}
  </Tag>
);

// Title row for a card or a page section, with an optional description and actions on the right
export const SectionHeader = ({ title, description, actions, as: Heading = 'h2', className = '' }) => (
  <div className={`flex flex-wrap items-end justify-between gap-x-4 gap-y-3 ${className}`}>
    <div className="min-w-0">
      <Heading className="text-base font-bold tracking-tight sm:text-lg">{title}</Heading>
      {description && <p className="mt-0.5 text-sm text-gray-600">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

// Label and value pairs, used for order and customer details
export const DetailList = ({ items, className = '' }) => (
  <dl className={`space-y-2.5 text-sm ${className}`}>
    {items
      .filter((item) => item && item.value !== undefined && item.value !== null && item.value !== '')
      .map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-4">
          <dt className="shrink-0 text-gray-600">{item.label}</dt>
          <dd className="min-w-0 text-right font-semibold break-words">{item.value}</dd>
        </div>
      ))}
  </dl>
);

export default Card;
