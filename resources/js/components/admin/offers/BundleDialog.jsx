import React, { useState } from 'react';
import { Add, Trash } from 'iconsax-react';
import ProductPicker from '../ProductPicker';
import { Alert, Button, Field, IconButton, Input, Modal, Select, Switch, Textarea } from '../ui';
import { api, formatPrice } from '../../../lib/admin';
import { showToast } from '../../../lib/toast';

const sizesOf = (product) => (Array.isArray(product?.storage_options) ? product.storage_options.filter((option) => option && option.storage) : []);

const unitPrice = (row) => {
  if (!row.product) return 0;
  const size = sizesOf(row.product).find((option) => option.storage === row.storage);
  return Number(size ? size.price : row.product.price) || 0;
};

let nextKey = 0;
const emptyRow = () => ({ key: `row-${nextKey++}`, product: null, name: '', storage: '', quantity: 1 });

// The form for a bundle: products that go together, sold for one price. `bundle` is given when editing.
const BundleDialog = ({ bundle = null, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: bundle?.name || '',
    description: bundle?.description || '',
    price: bundle?.price ?? '',
    is_active: bundle ? Boolean(bundle.is_active) : true,
  });
  const [rows, setRows] = useState(() =>
    bundle?.items?.length
      ? bundle.items.map((item) => ({ key: `row-${nextKey++}`, product: item.product, name: item.product?.product_name || '', storage: item.storage || '', quantity: item.quantity }))
      : [emptyRow(), emptyRow()]
  );
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const setRow = (key, changes) => setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...changes } : row)));

  const separately = rows.reduce((sum, row) => sum + unitPrice(row) * (Number(row.quantity) || 0), 0);
  const customerSaving = separately > 0 && Number(form.price) > 0 ? separately - Number(form.price) : 0;

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;

    const chosen = rows.filter((row) => row.product);
    if (chosen.length < 2) {
      setMessage('A bundle needs at least two products. Pick each one from the suggestions.');
      return;
    }

    setSaving(true);
    setErrors({});
    setMessage('');
    try {
      const body = {
        ...form,
        items: chosen.map((row) => ({ product_id: Number(row.product.id), storage: sizesOf(row.product).length > 0 ? row.storage : null, quantity: Number(row.quantity) || 1 })),
      };
      const { ok, data } = await api(bundle ? `/api/admin/bundles/${bundle.id}` : '/api/admin/bundles', { method: bundle ? 'PUT' : 'POST', body });
      if (ok && data?.success) {
        showToast('Bundle saved');
        onSaved(data.bundle);
        return;
      }
      setErrors(data?.errors || {});
      // Problems with a product row are shown together above the form
      const rowProblems = Object.entries(data?.errors || {})
        .filter(([key]) => key.startsWith('items'))
        .flatMap(([, messages]) => messages);
      setMessage(rowProblems[0] || (data?.errors ? 'Some details need fixing. Check the fields marked below.' : data?.message || 'We could not save the bundle. Try again.'));
    } catch (error) {
      console.error('Error saving bundle:', error);
      setMessage('We could not save the bundle. Check your connection and try again.');
    }
    setSaving(false);
  };

  return (
    <Modal
      title={bundle ? `Edit ${bundle.name}` : 'New bundle'}
      description="Products that go together, sold for one price that is lower than buying them separately."
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="bundle-form" loading={saving}>
            Save bundle
          </Button>
        </>
      }
    >
      <form id="bundle-form" onSubmit={save} noValidate className="space-y-5">
        {message && <Alert tone="error">{message}</Alert>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Bundle name" required error={errors.name}>
            <Input value={form.name} maxLength={120} onChange={(e) => setField('name', e.target.value)} placeholder="Apple starter set" />
          </Field>
          <Field label="Description" optional error={errors.description} hint="One or two lines on why these go together.">
            <Textarea rows={2} value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </Field>
        </div>

        {/* The products inside */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold">Products in the bundle</h3>
            <Button variant="secondary" size="sm" icon={Add} disabled={rows.length >= 8} onClick={() => setRows((prev) => [...prev, emptyRow()])}>
              Add product
            </Button>
          </div>

          <ul className="mt-3 space-y-3">
            {rows.map((row, index) => {
              const sizes = sizesOf(row.product);

              return (
                <li key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 rounded-2xl bg-gray-50 p-4 md:grid-cols-[minmax(0,1fr)_10rem_5rem_7rem_auto]">
                  <Field label={`Product ${index + 1}`} className="col-span-2 md:col-span-1">
                    <ProductPicker
                      size="sm"
                      value={row.name}
                      onChange={(name) => setRow(row.key, { name, product: null, storage: '' })}
                      onPick={(product) => setRow(row.key, { product, name: product.product_name, storage: sizesOf(product)[0]?.storage || '' })}
                    />
                  </Field>
                  <Field label="Size" className="col-span-2 md:col-span-1">
                    <Select size="sm" value={row.storage} disabled={sizes.length === 0} onChange={(e) => setRow(row.key, { storage: e.target.value })}>
                      {sizes.length === 0 ? <option value="">One size</option> : sizes.map((option) => <option key={option.storage}>{option.storage}</option>)}
                    </Select>
                  </Field>
                  <Field label="Qty">
                    <Input size="sm" type="number" inputMode="numeric" min="1" max="10" value={row.quantity} onChange={(e) => setRow(row.key, { quantity: e.target.value })} />
                  </Field>
                  <div className="hidden pb-2 text-right md:block">
                    <p className="text-xs text-gray-500">On its own</p>
                    <p className="font-bold tabular-nums">{row.product ? formatPrice(unitPrice(row) * (Number(row.quantity) || 0)) : formatPrice(0)}</p>
                  </div>
                  <IconButton icon={Trash} tone="danger" label={`Remove product ${index + 1}`} disabled={rows.length <= 2} onClick={() => setRows((prev) => prev.filter((entry) => entry.key !== row.key))} className="mb-0.5 justify-self-end" />
                </li>
              );
            })}
          </ul>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          <Field
            label="Bundle price"
            required
            error={errors.price}
            hint={
              separately > 0
                ? `Bought separately these cost ${formatPrice(separately)}.${customerSaving > 0 ? ` Customers save ${formatPrice(customerSaving)}.` : ''}`
                : 'Lower than buying the products separately.'
            }
          >
            <Input type="number" inputMode="decimal" min="0" step="0.01" prefix="₦" value={form.price} onChange={(e) => setField('price', e.target.value)} placeholder="0" />
          </Field>
          <div className="md:pt-8">
            <Switch checked={form.is_active} onChange={(on) => setField('is_active', on)} label="On sale" description="Turn this off to hide the bundle from the store without deleting it." />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default BundleDialog;
