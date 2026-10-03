import React, { useEffect, useMemo, useState } from 'react';
import { Add, ArrowLeft, GalleryAdd, Trash } from 'iconsax-react';
import ProductCard from '../ProductCard';
import { Alert, Button, Card, Field, IconButton, Input, SectionHeader, Select, Switch, Tabs, Textarea } from './ui';
import { api } from '../../lib/admin';
import { showToast } from '../../lib/toast';

const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const splitList = (value) =>
  String(value || '')
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const emptyForm = {
  product_name: '',
  category_id: '',
  type: 'product',
  price: '',
  old_price: '',
  overview: '',
  description: '',
  about: '',
  in_stock: true,
  stock_quantity: '',
  serial_numbers: '',
  product_status: 'new',
  colors: '',
  what_is_included: '',
  image_urls: '',
};

// One form for adding and editing both products and deals.
// Pass `item` (with its `type`) to edit; leave it out to create.
const ProductForm = ({ item = null, onCancel, onSuccess }) => {
  const isEdit = Boolean(item);

  const [formData, setFormData] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [hasStorage, setHasStorage] = useState(false);
  const [storageOptions, setStorageOptions] = useState([{ storage: '', price: '' }]);
  const [specifications, setSpecifications] = useState([]);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Load categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? [...data].sort((a, b) => a.name.localeCompare(b.name)) : []))
      .catch(console.error);
  }, []);

  // Populate form with existing data
  useEffect(() => {
    if (!item) return;

    setFormData({
      product_name: item.product_name || '',
      category_id: item.category_id || '',
      type: item.type === 'deal' ? 'deal' : 'product',
      price: item.price || '',
      old_price: item.old_price || '',
      overview: item.overview || '',
      description: item.description || '',
      about: item.about || '',
      in_stock: item.in_stock !== undefined ? Boolean(item.in_stock) : true,
      stock_quantity: item.stock_quantity ?? '',
      serial_numbers: Array.isArray(item.serial_numbers) ? item.serial_numbers.join('\n') : '',
      product_status: item.product_status || 'new',
      colors: Array.isArray(item.colors)
        ? item.colors.map((color) => (typeof color === 'object' && color !== null ? color.name : color)).join(', ')
        : item.colors || '',
      what_is_included: Array.isArray(item.what_is_included) ? item.what_is_included.join('\n') : item.what_is_included || '',
      image_urls: '',
    });

    setImages((item.images_url || []).map((url, index) => ({ id: `existing-${index}`, url, file: null, isExisting: true })));

    if (item.storage_options && item.storage_options.length > 0) {
      setHasStorage(true);
      setStorageOptions(item.storage_options.map((option) => ({ storage: option.storage || option, price: option.price || '' })));
    }

    if (item.specification && typeof item.specification === 'object') {
      setSpecifications(
        Object.entries(item.specification)
          .filter(([, value]) => typeof value !== 'object' || value === null)
          .map(([key, value], index) => ({ id: `spec-${index}`, key, value: value ?? '' }))
      );
    }
  }, [item]);

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleInputChange = (e) => setField(e.target.name, e.target.value);

  // Serial numbers: one per unit. If more are listed than the stock count, the count follows.
  const serialNumbers = splitList(formData.serial_numbers);
  const handleSerialsChange = (e) => {
    const listed = splitList(e.target.value).length;
    setField('serial_numbers', e.target.value);
    if (listed > (Number(formData.stock_quantity) || 0)) setField('stock_quantity', String(listed));
  };

  // Photos
  const addFiles = (fileList) => {
    const accepted = [];
    let problem = '';

    for (const file of Array.from(fileList)) {
      if (images.length + accepted.length >= MAX_IMAGES) {
        problem = `You can add up to ${MAX_IMAGES} photos.`;
        break;
      }
      if (!file.type.startsWith('image/')) {
        problem = 'Only image files can be added.';
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        problem = 'Each photo must be 2MB or smaller.';
        continue;
      }
      accepted.push({ id: `new-${Date.now()}-${accepted.length}`, url: URL.createObjectURL(file), file, isExisting: false });
    }

    if (accepted.length > 0) setImages((prev) => [...prev, ...accepted]);
    setErrorMessage(problem);
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const removed = prev.find((image) => image.id === id);
      // Clean up object URLs to prevent memory leaks
      if (removed && removed.url.startsWith('blob:')) URL.revokeObjectURL(removed.url);
      return prev.filter((image) => image.id !== id);
    });
  };

  // Storage options
  const updateStorageOption = (index, field, value) => {
    setStorageOptions((prev) => prev.map((option, i) => (i === index ? { ...option, [field]: value } : option)));
  };

  // Specifications
  const updateSpecification = (id, field, value) => {
    setSpecifications((prev) => prev.map((spec) => (spec.id === id ? { ...spec, [field]: value } : spec)));
  };

  const isDeal = formData.type === 'deal';
  const typeLabel = isDeal ? 'deal' : 'product';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setErrorMessage('');

    try {
      const submitData = new FormData();

      // Add _method for Laravel PUT request
      if (isEdit) submitData.append('_method', 'PUT');

      ['product_name', 'category_id', 'price', 'overview', 'description', 'about', 'product_status'].forEach((key) => {
        submitData.append(key, formData[key] ?? '');
      });
      if (isDeal) {
        submitData.append('in_stock', formData.in_stock ? '1' : '0');
        submitData.append('old_price', formData.old_price ?? '');
      } else {
        // Products are counted: the stock count decides whether they are on sale
        submitData.append('stock_quantity', formData.stock_quantity ?? '');
        if (serialNumbers.length > 0) serialNumbers.forEach((serial, index) => submitData.append(`serial_numbers[${index}]`, serial));
        else if (isEdit) submitData.append('serial_numbers', '');
      }

      // Comma or line separated lists become arrays. An empty value clears the field.
      const colors = splitList(formData.colors);
      if (colors.length > 0) colors.forEach((color, index) => submitData.append(`colors[${index}]`, color));
      else if (isEdit) submitData.append('colors', '');

      const included = splitList(formData.what_is_included);
      if (included.length > 0) included.forEach((entry, index) => submitData.append(`what_is_included[${index}]`, entry));
      else if (isEdit) submitData.append('what_is_included', '');

      const specs = specifications.filter((spec) => spec.key.trim() && String(spec.value).trim());
      if (specs.length > 0) {
        specs.forEach((spec, index) => {
          submitData.append(`specification[${index}][key]`, spec.key.trim());
          submitData.append(`specification[${index}][value]`, String(spec.value).trim());
        });
      } else if (isEdit) {
        submitData.append('specification', '');
      }

      // Add storage options if enabled
      const storage = hasStorage ? storageOptions.filter((option) => option.storage && option.price) : [];
      if (storage.length > 0) {
        storage.forEach((option, index) => {
          submitData.append(`storage_options[${index}][storage]`, option.storage);
          submitData.append(`storage_options[${index}][price]`, option.price);
        });
      } else if (isEdit) {
        submitData.append('storage_options', '');
      }

      // Photos: uploads go as files, links as text
      const links = splitList(formData.image_urls);
      const kept = images.filter((image) => image.isExisting).map((image) => image.url);
      if (isEdit) {
        [...kept, ...links].forEach((url, index) => submitData.append(`existing_images[${index}]`, url));
      } else {
        links.forEach((url, index) => submitData.append(`images_url[${index}]`, url));
      }
      images
        .filter((image) => !image.isExisting && image.file)
        .forEach((image, index) => submitData.append(`product_images[${index}]`, image.file));

      const endpoint = isEdit ? `/api/admin/${item.type}s/${item.id}` : isDeal ? '/api/admin/deals' : '/api/admin/products';
      const { ok, data } = await api(endpoint, { method: 'POST', formData: submitData });

      if (ok && data?.success) {
        showToast(isEdit ? `${isDeal ? 'Deal' : 'Product'} updated` : `${isDeal ? 'Deal' : 'Product'} created`);
        if (onSuccess) onSuccess();
        return;
      }

      if (data?.errors) {
        setErrors(data.errors);
        setErrorMessage('Some details need fixing. Check the fields marked below.');
      } else {
        setErrorMessage(data?.message || `We could not save the ${typeLabel}. Try again.`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setErrorMessage(`We could not save the ${typeLabel}. Check your connection and try again.`);
    }

    setLoading(false);
  };

  // What the storefront card will look like with the current values
  const preview = useMemo(() => {
    const options = hasStorage ? storageOptions.filter((option) => option.storage && option.price) : [];
    const links = splitList(formData.image_urls);
    return {
      id: 'preview',
      type: formData.type,
      product_name: formData.product_name || 'Product name',
      price: formData.price || 0,
      display_price: options.length > 0 ? options[0].price : formData.price || 0,
      old_price: isDeal ? formData.old_price : null,
      images_url: [images[0]?.url || links[0]].filter(Boolean),
      in_stock: isDeal ? formData.in_stock : Number(formData.stock_quantity) > 0,
      product_status: formData.product_status,
      category: { name: categories.find((category) => String(category.id) === String(formData.category_id))?.name },
      default_storage: options.length > 0 ? options[0].storage : null,
      storage_options: options,
      colors: splitList(formData.colors),
    };
  }, [formData, images, hasStorage, storageOptions, categories, isDeal]);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-ink">
            <ArrowLeft size={16} color="currentColor" variant="Linear" />
            Back to products
          </button>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{isEdit ? `Edit ${typeLabel}` : 'Add a product'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {loading ? 'Saving' : isEdit ? 'Save changes' : `Create ${typeLabel}`}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <Alert tone="error" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
        <div className="space-y-4">
          {/* Basics */}
          <Card>
            <SectionHeader title="Basics" />
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Product name" required error={errors.product_name} className="md:col-span-2">
                <Input name="product_name" value={formData.product_name} onChange={handleInputChange} placeholder="iPhone 17 Pro Max 256GB" />
              </Field>

              <Field label="Category" required={!isDeal} error={errors.category_id}>
                <Select name="category_id" value={formData.category_id} onChange={handleInputChange}>
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Condition" error={errors.product_status}>
                <Select name="product_status" value={formData.product_status} onChange={handleInputChange}>
                  <option value="new">New</option>
                  <option value="uk_used">UK used</option>
                  <option value="refurbished">Refurbished</option>
                </Select>
              </Field>

              {isDeal && (
                <div className="md:col-span-2">
                  <Switch
                    checked={formData.in_stock}
                    onChange={(checked) => setField('in_stock', checked)}
                    label="In stock"
                    description="Turn this off to show the item as out of stock. Customers will not be able to add it to the cart."
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Stock (deals are not counted) */}
          {!isDeal && (
            <Card>
              <SectionHeader title="Stock" description="The count goes down by itself each time an order is confirmed. At 0 the product shows as out of stock." />
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Stock count"
                  required
                  error={errors.stock_quantity}
                  hint={isEdit && Number(item?.units_sold) > 0 ? `How many units are left to sell. ${Number(item.units_sold).toLocaleString('en-NG')} sold so far.` : 'How many units you have to sell.'}
                >
                  <Input name="stock_quantity" type="number" inputMode="numeric" min="0" step="1" value={formData.stock_quantity} onChange={handleInputChange} placeholder="0" />
                </Field>

                <Field
                  label="Serial numbers"
                  optional
                  error={errors.serial_numbers}
                  hint={
                    serialNumbers.length > 0
                      ? `${serialNumbers.length} listed for ${Number(formData.stock_quantity) || 0} in stock. The ones at the top are sold first and printed on the invoice.`
                      : 'Serial number or IMEI of each unit, one per line. Scan them one after another. They are printed on the invoice when a unit is sold.'
                  }
                  className="md:col-span-2"
                >
                  <Textarea
                    name="serial_numbers"
                    rows={Math.min(8, Math.max(3, serialNumbers.length + 1))}
                    value={formData.serial_numbers}
                    onChange={handleSerialsChange}
                    placeholder={'356789104523871\n356789104523889'}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                </Field>
              </div>
            </Card>
          )}

          {/* Pricing */}
          <Card>
            <SectionHeader
              title="Pricing"
              actions={
                !isEdit && (
                  <Tabs
                    size="sm"
                    label="Listing type"
                    value={formData.type}
                    onChange={(type) => setField('type', type)}
                    tabs={[
                      { id: 'product', label: 'Regular product' },
                      { id: 'deal', label: 'Flash deal' },
                    ]}
                  />
                )
              }
            />
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label={isDeal ? 'Deal price' : 'Price'} required error={errors.price} hint={isDeal ? 'What the customer pays during the deal.' : undefined}>
                <Input name="price" type="number" inputMode="decimal" min="0" step="0.01" prefix="₦" value={formData.price} onChange={handleInputChange} placeholder="0" />
              </Field>

              {isDeal && (
                <Field label="Original price" required={!isEdit} error={errors.old_price} hint="Shown crossed out next to the deal price.">
                  <Input name="old_price" type="number" inputMode="decimal" min="0" step="0.01" prefix="₦" value={formData.old_price} onChange={handleInputChange} placeholder="0" />
                </Field>
              )}
            </div>

            <div className="mt-5">
              <Switch
                checked={hasStorage}
                onChange={setHasStorage}
                label="Different prices by storage size"
                description="For phones, tablets and laptops sold in more than one capacity. The first option is the price shown on the store."
              />

              {hasStorage && (
                <div className="mt-4 space-y-3">
                  {storageOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        size="sm"
                        aria-label={`Storage size ${index + 1}`}
                        value={option.storage}
                        onChange={(e) => updateStorageOption(index, 'storage', e.target.value)}
                        placeholder="256GB"
                      />
                      <Input
                        size="sm"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        prefix="₦"
                        aria-label={`Price for storage size ${index + 1}`}
                        value={option.price}
                        onChange={(e) => updateStorageOption(index, 'price', e.target.value)}
                        placeholder="0"
                      />
                      <IconButton
                        icon={Trash}
                        tone="danger"
                        label="Remove this storage option"
                        disabled={storageOptions.length <= 1}
                        onClick={() => setStorageOptions((prev) => prev.filter((_, i) => i !== index))}
                      />
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" icon={Add} onClick={() => setStorageOptions((prev) => [...prev, { storage: '', price: '' }])}>
                    Add storage option
                  </Button>
                  {errors.storage_options && <p className="text-sm text-sale">{[].concat(errors.storage_options)[0]}</p>}
                </div>
              )}
            </div>
          </Card>

          {/* Photos */}
          <Card>
            <SectionHeader title="Photos" description={`Up to ${MAX_IMAGES} photos, 2MB each. Square photos around 800 by 800 look best. The first one is the main photo.`} />

            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {images.map((image, index) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                  <img src={image.url} alt={`Photo ${index + 1}`} className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-ink/80 text-white transition-colors hover:bg-sale"
                  >
                    <Add size={18} color="currentColor" variant="Linear" className="rotate-45" />
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <label
                  className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center text-gray-600 transition-colors hover:border-brand hover:text-brand"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    addFiles(e.dataTransfer.files);
                  }}
                >
                  <GalleryAdd size={24} color="currentColor" variant="Linear" />
                  <span className="px-1 text-xs font-semibold">Add photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = ''; // Reset file input
                    }}
                  />
                </label>
              )}
            </div>
            {errors.product_images && <p className="mt-2 text-sm text-sale">{[].concat(errors.product_images)[0]}</p>}

            <Field label="Photo links" optional hint="Paste links to photos hosted elsewhere, one per line." className="mt-5">
              <Textarea name="image_urls" rows={2} value={formData.image_urls} onChange={handleInputChange} placeholder="https://example.com/photo.jpg" />
            </Field>
          </Card>

          {/* Details */}
          <Card>
            <SectionHeader title="Details" />
            <div className="mt-4 space-y-4">
              <Field label="Overview" optional hint="One or two lines. Used in search results and link previews." error={errors.overview}>
                <Textarea name="overview" rows={2} value={formData.overview} onChange={handleInputChange} />
              </Field>

              <Field label="Description" optional error={errors.description}>
                <Textarea name="description" rows={4} value={formData.description} onChange={handleInputChange} />
              </Field>

              <Field label="Key features" optional hint="Each sentence becomes a bullet on the product page." error={errors.about}>
                <Textarea name="about" rows={3} value={formData.about} onChange={handleInputChange} placeholder="6.9 inch display. 48MP camera. All-day battery." />
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Colours" optional hint="Separate with commas." error={errors.colors}>
                  <Input name="colors" value={formData.colors} onChange={handleInputChange} placeholder="Black, Blue, Silver" />
                </Field>

                <Field label="What is included" optional hint="Separate with commas or new lines." error={errors.what_is_included}>
                  <Textarea name="what_is_included" rows={2} value={formData.what_is_included} onChange={handleInputChange} placeholder="Phone, USB-C cable" />
                </Field>
              </div>
            </div>
          </Card>

          {/* Specifications */}
          <Card>
            <SectionHeader
              title="Specifications"
              description="Shown as a table on the product page."
              actions={
                <Button variant="secondary" size="sm" icon={Add} onClick={() => setSpecifications((prev) => [...prev, { id: `spec-${Date.now()}`, key: '', value: '' }])}>
                  Add row
                </Button>
              }
            />
            {specifications.length > 0 ? (
              <div className="mt-4 space-y-3">
                {specifications.map((spec, index) => (
                  <div key={spec.id} className="flex items-center gap-2">
                    <Input size="sm" aria-label={`Specification ${index + 1} name`} value={spec.key} onChange={(e) => updateSpecification(spec.id, 'key', e.target.value)} placeholder="Screen size" />
                    <Input size="sm" aria-label={`Specification ${index + 1} value`} value={spec.value} onChange={(e) => updateSpecification(spec.id, 'value', e.target.value)} placeholder="6.9 inches" />
                    <IconButton icon={Trash} tone="danger" label="Remove this specification" onClick={() => setSpecifications((prev) => prev.filter((entry) => entry.id !== spec.id))} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-600">No specifications yet.</p>
            )}
            {errors.specification && <p className="mt-2 text-sm text-sale">{[].concat(errors.specification)[0]}</p>}
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? 'Saving' : isEdit ? 'Save changes' : `Create ${typeLabel}`}
            </Button>
          </div>
        </div>

        {/* Live preview of the storefront card */}
        <aside className="hidden lg:sticky lg:top-0 lg:block" aria-label="Preview">
          <p className="mb-2 text-sm font-semibold">On the store</p>
          <div className="pointer-events-none" aria-hidden="true" inert>
            <ProductCard product={preview} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-gray-500">This is how the card looks to customers. It updates as you type.</p>
        </aside>
      </div>
    </form>
  );
};

export default ProductForm;
