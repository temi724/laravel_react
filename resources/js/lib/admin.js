// Shared helpers for the admin screens
import { formatPrice } from './format';

export { formatPrice };

const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

// JSON request with the CSRF header. Resolves to { ok, status, data } and never throws on HTTP errors.
export const api = async (url, { method = 'GET', body, formData } = {}) => {
  const headers = { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() };
  const options = { method, headers };

  if (formData) {
    options.body = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }
  return { ok: response.ok, status: response.status, data };
};

// The signed-in admin, as the admin layout wrote it: { id, name, is_super, permissions }
export const currentAdmin = () => window.MurphylogAdmin || { id: '', name: '', is_super: false, permissions: [] };

// Whether the signed-in admin holds a permission ("products.edit"...). The super admin holds them all.
// This only decides what the screen offers; the server checks every action again.
export const can = (permission) => {
  const admin = currentAdmin();
  return Boolean(admin.is_super) || (admin.permissions || []).includes(permission);
};

// Downloads a file the server builds (an Excel export, the import sample). The name comes from
// the server; a refusal is thrown as an Error carrying the server's own message.
export const downloadFile = async (url, fallbackName = 'download') => {
  const response = await fetch(url, { headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() }, credentials: 'same-origin' });

  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(Object.values(problem?.errors || {}).flat()[0] || problem?.message || 'The file could not be downloaded.');
  }

  const named = /filename="?([^";]+)"?/i.exec(response.headers.get('content-disposition') || '');
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = named ? named[1] : fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

// 1,250 -> "1.3k", 2,400,000 -> "2.4m"
export const abbreviateNumber = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  if (Math.abs(num) < 1000) return num.toLocaleString('en-NG');

  const units = [
    [1e9, 'b'],
    [1e6, 'm'],
    [1e3, 'k'],
  ];
  const [size, suffix] = units.find(([unit]) => Math.abs(num) >= unit);
  return (num / size).toFixed(1).replace(/\.0$/, '') + suffix;
};

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// "1 October 2026", for invoices and receipts
export const formatLongDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';

// YYYY-MM-DD in the browser's own time zone (toISOString would shift the day near midnight)
export const localDate = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const today = () => localDate();

export const startOfMonth = () => localDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

export const startOfYear = () => localDate(new Date(new Date().getFullYear(), 0, 1));

// order_details is stored as JSON; older rows may hold it as a string
export const parseOrderDetails = (orderDetails) => {
  if (!orderDetails) return [];
  if (typeof orderDetails === 'string') {
    try {
      const parsed = JSON.parse(orderDetails);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return Array.isArray(orderDetails) ? orderDetails : [];
};

// Total of a sale: the sum of its line items, falling back to the stored total for offline sales
export const saleTotal = (sale) => {
  const fromItems = parseOrderDetails(sale?.order_details).reduce((sum, item) => sum + Number.parseFloat(item.subtotal || 0), 0);
  if (fromItems > 0) return fromItems;
  return Number.parseFloat(sale?.total_amount || sale?.subtotal || 0) || 0;
};

// Serial numbers as typed: trimmed, blanks dropped
export const cleanSerials = (serials) => (Array.isArray(serials) ? serials.map((serial) => String(serial ?? '').trim()).filter(Boolean) : []);

// The serial numbers (or IMEIs) recorded on one line of an order.
// A bundle line names each product's: ["iPhone 17: A1, A2", "iPad Air: B1"].
export const itemSerials = (item) => {
  if (item?.type === 'bundle' && Array.isArray(item.components)) {
    return item.components
      .map((part) => ({ name: part.name || 'Product', serials: cleanSerials(part.serial_numbers) }))
      .filter((part) => part.serials.length > 0)
      .map((part) => `${part.name}: ${part.serials.join(', ')}`);
  }
  return cleanSerials(item?.serial_numbers);
};

// The same, as the text printed after "S/N"
export const serialText = (item) => itemSerials(item).join(item?.type === 'bundle' ? '; ' : ', ');

// The small print under an item's name: its options, what a bundle contains, an offer price
export const lineNote = (item) => {
  const parts = [item?.selected_storage, item?.selected_color, item?.description].filter(Boolean);

  if (item?.type === 'bundle' && Array.isArray(item.components)) {
    parts.push(
      `Bundle of ${item.components
        .map((part) => `${Number(part.quantity) > 1 ? `${part.quantity} x ` : ''}${part.name || 'Product'}${part.storage ? ` (${part.storage})` : ''}`)
        .join(', ')}`
    );
  }
  if (item?.promotion_label) parts.push(`${item.promotion_label} price`);

  return parts.join(', ');
};

export const percentOf = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

// Digits with one optional leading plus, used for phone fields
export const sanitizePhone = (value) => {
  const digits = String(value).replace(/\D/g, '').slice(0, 15);
  return String(value).trim().startsWith('+') ? `+${digits}` : digits;
};
