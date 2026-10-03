import React, { useEffect, useRef } from 'react';
import { Add } from 'iconsax-react';
import Button from './Button';

// Dialog. Escape and the backdrop close it, the page behind does not scroll, and focus moves in.
const Modal = ({ title, description, onClose, children, footer, size = 'md', labelledBy = 'modal-title' }) => {
  const panelRef = useRef(null);
  // The latest onClose without re-running the effect below: callers pass a new function on every
  // render, and taking the focus again each time would pull it out of the field being typed in.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeRef.current();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const width = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-4xl' }[size] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/50 sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative flex max-h-[92dvh] w-full ${width} animate-rise flex-col rounded-t-3xl bg-white outline-none sm:rounded-3xl`}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <h2 id={labelledBy} className="text-lg font-extrabold tracking-tight">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink"
          >
            <Add size={24} color="currentColor" variant="Linear" className="rotate-45" />
          </button>
        </div>

        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>}

        {footer && <div className="flex flex-wrap justify-end gap-2 px-5 pt-2 pb-5 sm:px-6 sm:pb-6">{footer}</div>}
      </div>
    </div>
  );
};

// Yes/no question before an action that changes data
export const ConfirmDialog = ({ title = 'Are you sure?', message, confirmLabel = 'Confirm', tone = 'primary', loading = false, onConfirm, onCancel }) => (
  <Modal
    title={title}
    description={message}
    onClose={onCancel}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    }
  />
);

export default Modal;
