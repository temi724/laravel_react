import React from 'react';

// Segmented control: a grey pill track with a white active pill.
// `tabs` is [{ id, label }]. Used for page tabs and for small either/or filters.
const Tabs = ({ tabs, value, onChange, label, size = 'md', className = '' }) => (
  <div className={`no-scrollbar max-w-full overflow-x-auto ${className}`}>
    <div className="inline-flex rounded-full bg-gray-200/70 p-1" role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`rounded-full font-semibold whitespace-nowrap transition-colors ${size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm'} ${
              active ? 'bg-white text-ink' : 'text-gray-600 hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  </div>
);

export default Tabs;
