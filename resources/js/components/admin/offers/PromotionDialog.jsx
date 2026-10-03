import React, { useState } from 'react';
import ProductPicker from '../ProductPicker';
import { Alert, Button, Field, Input, Modal, Select } from '../ui';
import { api, formatPrice, localDate } from '../../../lib/admin';
import { showToast } from '../../../lib/toast';

// An ISO moment as the value a datetime-local box expects, in this device's time zone
const toLocalInput = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const sizesOf = (product) => (Array.isArray(product?.storage_options) ? product.storage_options.filter((option) => option && option.storage) : []);

const usualPrice = (product, storage) => {
  if (!product) return null;
  const size = sizesOf(product).find((option) => option.storage === storage);
  return Number(size ? size.price : product.price) || 0;
};

const COPY = {
  deal_of_day: {
    add: 'Set a deal of the day',
    edit: 'Edit deal of the day',
    intro: 'One product at a special price for a whole day. It shows near the top of the store with a countdown.',
    save: 'Save deal',
    saved: 'Deal of the day saved',
  },
  drop: {
    add: 'Schedule a drop',
    edit: 'Edit drop',
    intro: 'A set number of units at a special price, released at a set time. The product is held back from sale until the drop starts.',
    save: 'Save drop',
    saved: 'Drop saved',
  },
};

// The form for a deal of the day or a drop. `promotion` is given when editing.
const PromotionDialog = ({ type, promotion = null, onClose, onSaved }) => {
  const isDrop = type === 'drop';
  const copy = COPY[type];

  const [product, setProduct] = useState(promotion?.product || null);
  const [productName, setProductName] = useState(promotion?.product?.product_name || '');
  const [form, setForm] = useState({
    storage: promotion?.storage || '',
    price: promotion?.price ?? '',
    day: localDate(promotion?.starts_at ? new Date(promotion.starts_at) : new Date()),
    starts_at: toLocalInput(promotion?.starts_at) || '',
    ends_at: toLocalInput(promotion?.ends_at) || '',
    quantity_limit: promotion?.quantity_limit ?? '',
    per_order_limit: promotion?.per_order_limit ?? (isDrop ? 1 : ''),
    headline: promotion?.headline || '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const sizes = sizesOf(product);
  const usual = usualPrice(product, form.storage);
  const saves = usual && Number(form.price) > 0 ? usual - Number(form.price) : 0;

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const pick = (picked) => {
    const options = sizesOf(picked);
    setProduct(picked);
    setProductName(picked.product_name);
    setForm((prev) => ({ ...prev, storage: options[0]?.storage || '' }));
    setErrors((prev) => ({ ...prev, product_id: undefined, storage: undefined }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;

    if (!product) {
      setErrors({ product_id: 'Choose the product from the suggestions.' });
      return;
    }

    // The deal of the day runs from midnight to midnight on the chosen day, by this device's clock
    const dayStart = new Date(`${form.day}T00:00`);
    const body = {
      type,
      product_id: Number(product.id),
      storage: sizes.length > 0 ? form.storage : null,
      price: form.price,
      starts_at: isDrop ? (form.starts_at ? new Date(form.starts_at).toISOString() : null) : dayStart.toISOString(),
      ends_at: isDrop ? (form.ends_at ? new Date(form.ends_at).toISOString() : null) : new Date(dayStart.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      quantity_limit: isDrop ? form.quantity_limit || null : null,
      per_order_limit: form.per_order_limit || null,
      headline: form.headline || null,
    };

    setSaving(true);
    setErrors({});
    setMessage('');
    try {
      const { ok, data } = await api(promotion ? `/api/admin/promotions/${promotion.id}` : '/api/admin/promotions', { method: promotion ? 'PUT' : 'POST', body });
      if (ok && data?.success) {
        showToast(copy.saved);
        onSaved(data.promotion);
        return;
      }
      setErrors(data?.errors || {});
      setMessage(data?.errors ? 'Some details need fixing. Check the fields marked below.' : data?.message || 'We could not save this. Try again.');
    } catch (error) {
      console.error('Error saving promotion:', error);
      setMessage('We could not save this. Check your connection and try again.');
    }
    setSaving(false);
  };

  return (
    <Modal
      title={promotion ? copy.edit : copy.add}
      description={copy.intro}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="promotion-form" loading={saving}>
            {copy.save}
          </Button>
        </>
      }
    >
      <form id="promotion-form" onSubmit={save} noValidate className="space-y-4">
        {message && <Alert tone="error">{message}</Alert>}

        <Field
          label="Product"
          required
          error={errors.product_id}
          hint={product ? `Usual price ${formatPrice(usual)}. ${Number(product.stock_quantity) || 0} in stock.` : 'Type a name and pick the product from the list.'}
        >
          <ProductPicker
            value={productName}
            onChange={(name) => {
              setProductName(name);
              setProduct(null);
            }}
            onPick={pick}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sizes.length > 0 && (
            <Field label="Size" required error={errors.storage} hint="The offer price is for this size only.">
              <Select value={form.storage} onChange={(e) => setField('storage', e.target.value)}>
                {sizes.map((option) => (
                  <option key={option.storage} value={option.storage}>
                    {option.storage} ({formatPrice(option.price)})
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label={isDrop ? 'Drop price' : 'Deal price'} required error={errors.price} hint={saves > 0 ? `Customers save ${formatPrice(saves)}.` : 'Lower than the usual price.'}>
            <Input type="number" inputMode="decimal" min="0" step="0.01" prefix="₦" value={form.price} onChange={(e) => setField('price', e.target.value)} placeholder="0" />
          </Field>

          {isDrop ? (
            <>
              <Field label="Starts" required error={errors.starts_at} hint="The moment the drop goes live.">
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setField('starts_at', e.target.value)} />
              </Field>
              <Field label="Ends" optional error={errors.ends_at} hint="Left empty, it runs until the units are gone.">
                <Input type="datetime-local" value={form.ends_at} min={form.starts_at || undefined} onChange={(e) => setField('ends_at', e.target.value)} />
              </Field>
              <Field label="Units in the drop" required error={errors.quantity_limit} hint="How many are sold at the drop price.">
                <Input type="number" inputMode="numeric" min="1" step="1" value={form.quantity_limit} onChange={(e) => setField('quantity_limit', e.target.value)} />
              </Field>
            </>
          ) : (
            <Field label="Day" required error={errors.starts_at || errors.ends_at} hint="Runs from midnight to midnight.">
              <Input type="date" value={form.day} onChange={(e) => setField('day', e.target.value)} />
            </Field>
          )}

          <Field label="Limit per order" optional error={errors.per_order_limit} hint="The most one customer can buy at this price in one order.">
            <Input type="number" inputMode="numeric" min="1" step="1" value={form.per_order_limit} onChange={(e) => setField('per_order_limit', e.target.value)} />
          </Field>
        </div>

        <Field label="Headline" optional error={errors.headline} hint="Shown instead of the product name, for example “The weekend console drop”.">
          <Input value={form.headline} maxLength={120} onChange={(e) => setField('headline', e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
};

export default PromotionDialog;
