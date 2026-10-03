import React from 'react';
import Card from './Card';

// A single figure with a label. `icon` is an iconsax component, `note` a short line under the value,
// `badge` a small element on the right (for example a share of the total).
const StatCard = ({ label, value, icon: Icon, note, badge, loading = false }) => (
  <Card className="flex flex-col">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {Icon && (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-ink">
          <Icon size={18} color="currentColor" variant="Linear" />
        </span>
      )}
    </div>

    <div className="mt-3 flex items-end justify-between gap-3">
      {loading ? (
        <span className="h-8 w-24 animate-pulse rounded-full bg-gray-100" aria-hidden="true" />
      ) : (
        <p className="text-2xl leading-8 font-extrabold tracking-tight tabular-nums sm:text-3xl">{value}</p>
      )}
      {badge}
    </div>

    {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
  </Card>
);

export default StatCard;
