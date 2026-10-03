// One toast for the whole storefront: an ink pill at the bottom of the screen.
// Styling and the enter/leave transition live in app.css (.toast).
let host = null;

const getHost = () => {
  if (host && document.body.contains(host)) return host;

  host = document.createElement('div');
  host.className = 'toast-host';
  host.setAttribute('role', 'status');
  host.setAttribute('aria-live', 'polite');
  document.body.appendChild(host);
  return host;
};

export const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' toast-error' : ''}`;
  toast.textContent = message;
  getHost().appendChild(toast);

  setTimeout(() => {
    toast.dataset.leaving = 'true';
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // In case the transition never runs (reduced motion, hidden tab)
    setTimeout(() => toast.remove(), 400);
  }, 2600);
};

export default showToast;
