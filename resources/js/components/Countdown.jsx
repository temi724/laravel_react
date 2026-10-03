import React, { useEffect, useRef, useState } from 'react';
import { serverNow } from '../stores/offersStore';

const partsOf = (milliseconds) => {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
};

const two = (value) => String(value).padStart(2, '0');

// Time left until `to` (an ISO date), counted on the server's clock. Calls onDone once at zero.
//   variant "tiles": one tile per unit, for the deal of the day
//   variant "inline": "2d 04h 12m 09s" as text, for cards and the product page
// Digits change in place with no animation: a clock that moves every second should not also move.
const Countdown = ({ to, onDone, variant = 'inline', tone = 'dark', className = '' }) => {
  const target = new Date(to).getTime();
  const [left, setLeft] = useState(() => target - serverNow());
  const done = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    done.current = false;

    const tick = () => {
      const remaining = target - serverNow();
      setLeft(remaining);
      if (remaining <= 0 && !done.current) {
        done.current = true;
        doneRef.current?.();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (!Number.isFinite(target)) return null;

  const { days, hours, minutes, seconds } = partsOf(left);
  // Screen readers get the time once, not a new announcement every second
  const spoken = `${days > 0 ? `${days} days ` : ''}${hours} hours ${minutes} minutes left`;

  if (variant === 'tiles') {
    const units = [...(days > 0 ? [[days, 'days']] : []), [hours, 'hrs'], [minutes, 'min'], [seconds, 'sec']];
    const tile = tone === 'light' ? 'bg-white/10 text-white' : 'bg-ink text-white';

    return (
      <div className={`flex items-start gap-1.5 ${className}`} role="timer" aria-label={spoken}>
        {units.map(([value, unit]) => (
          <div key={unit} className="flex flex-col items-center gap-1" aria-hidden="true">
            <span className={`flex h-12 min-w-12 items-center justify-center rounded-xl px-2 text-xl font-extrabold tabular-nums ${tile}`}>{two(value)}</span>
            <span className={`text-[11px] font-semibold ${tone === 'light' ? 'text-white/70' : 'text-gray-500'}`}>{unit}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <span className={`tabular-nums ${className}`} role="timer" aria-label={spoken}>
      <span aria-hidden="true">
        {days > 0 ? `${days}d ` : ''}
        {two(hours)}h {two(minutes)}m {two(seconds)}s
      </span>
    </span>
  );
};

export default Countdown;
