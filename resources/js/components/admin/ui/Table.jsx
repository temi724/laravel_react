import React from 'react';

// Table inside a rounded, bordered surface that scrolls sideways on small screens
export const Table = ({ children, className = '' }) => (
  <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-white ${className}`}>
    {/* `relative` keeps screen-reader-only labels in the header inside this scroll area */}
    <div className="relative overflow-x-auto">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  </div>
);

export const Th = ({ align = 'left', className = '', children }) => (
  <th
    scope="col"
    className={`border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold whitespace-nowrap text-gray-600 first:pl-5 last:pr-5 ${
      align === 'right' ? 'text-right' : 'text-left'
    } ${className}`}
  >
    {children}
  </th>
);

export const Td = ({ align = 'left', className = '', children, ...props }) => (
  <td className={`px-4 py-3.5 align-middle first:pl-5 last:pr-5 ${align === 'right' ? 'text-right' : ''} ${className}`} {...props}>
    {children}
  </td>
);

// Placeholder rows with the table's shape, shown while data loads
export const TableSkeleton = ({ columns, rows = 6 }) => (
  <>
    {[...Array(rows)].map((_, row) => (
      <tr key={row} className="border-b border-gray-100 last:border-0" aria-hidden="true">
        {[...Array(columns)].map((__, column) => (
          <Td key={column}>
            <span className={`block h-4 animate-pulse rounded-full bg-gray-100 ${column === 0 ? 'w-40' : 'w-20'}`} />
          </Td>
        ))}
      </tr>
    ))}
  </>
);

// A single full-width row for the empty and error states
export const TableMessage = ({ columns, children }) => (
  <tr>
    <td colSpan={columns} className="px-5 py-14">
      {children}
    </td>
  </tr>
);

export default Table;
