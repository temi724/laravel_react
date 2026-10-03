import React from 'react';
import { ArrowLeft2, ArrowRight2, CloseCircle, SearchNormal1 } from 'iconsax-react';
import { Input } from './Field';
import { IconButton } from './Button';
import { today } from '../../../lib/admin';

// Search box for toolbars
export const SearchInput = ({ value, onChange, placeholder = 'Search', label = 'Search', className = '' }) => (
  <label className={`relative block ${className}`}>
    <span className="sr-only">{label}</span>
    <SearchNormal1 size={16} color="currentColor" variant="Linear" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-500" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="field field-sm pr-9 pl-10 [&::-webkit-search-cancel-button]:hidden"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear search"
        className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:text-ink"
      >
        <CloseCircle size={16} color="currentColor" variant="Linear" />
      </button>
    )}
  </label>
);

// From and To dates. `value` is { startDate, endDate } in YYYY-MM-DD.
export const DateRange = ({ value, onChange, className = '' }) => (
  <fieldset className={`flex items-center gap-2 ${className}`}>
    <legend className="sr-only">Date range</legend>
    <Input
      type="date"
      size="sm"
      aria-label="From date"
      value={value.startDate}
      max={value.endDate || today()}
      onChange={(e) => onChange({ ...value, startDate: e.target.value })}
      className="w-[9.5rem]"
    />
    <span className="text-sm text-gray-500">to</span>
    <Input
      type="date"
      size="sm"
      aria-label="To date"
      value={value.endDate}
      min={value.startDate}
      max={today()}
      onChange={(e) => onChange({ ...value, endDate: e.target.value })}
      className="w-[9.5rem]"
    />
  </fieldset>
);

export const Pagination = ({ page, totalPages, onChange, className = '' }) => {
  if (totalPages <= 1) return null;

  return (
    <nav className={`flex items-center justify-between gap-4 ${className}`} aria-label="Pagination">
      <p className="text-sm text-gray-600 tabular-nums">
        Page <span className="font-semibold text-ink">{page}</span> of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <IconButton icon={ArrowLeft2} label="Previous page" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1} className="border border-gray-200 bg-white" />
        <IconButton icon={ArrowRight2} label="Next page" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="border border-gray-200 bg-white" />
      </div>
    </nav>
  );
};
