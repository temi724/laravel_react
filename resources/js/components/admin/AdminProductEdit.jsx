import React, { useState, useEffect } from 'react';

const AdminProductEdit = ({ item, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    product_name: '',
    category_id: '',
    price: '',
    old_price: '',
    overview: '',
    description: '',
    about: '',
    in_stock: true,
    product_status: 'new',
    colors: '',
    what_is_included: '',
    has_storage: false,
    specification: {}
  });

  const [categories, setCategories] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [storageOptions, setStorageOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Load categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);

    // Populate form with existing data
    if (item) {
      setFormData({
        product_name: item.product_name || '',
        category_id: item.category_id || '',
        price: item.price || '',
        old_price: item.old_price || '',
        overview: item.overview || '',
        description: item.description || '',
        about: item.about || '',
        in_stock: item.in_stock !== undefined ? item.in_stock : true,
        product_status: item.product_status || 'new',
        colors: Array.isArray(item.colors) ? item.colors.join(', ') : (item.colors || ''),
        what_is_included: Array.isArray(item.what_is_included) ? item.what_is_included.join(', ') : (item.what_is_included || ''),
        has_storage: item.storage_options && item.storage_options.length > 0,
        specification: item.specification || {}
      });

      // Set existing images
      if (item.images_url && item.images_url.length > 0) {
        const existingImages = item.images_url.map((url, index) => ({
          id: `existing-${index}`,
          url: url,
          file: null,
          isExisting: true
        }));
        setProductImages(existingImages);
      }

      // Set storage options
      if (item.storage_options && item.storage_options.length > 0) {
        setStorageOptions(item.storage_options.map(option => ({
          storage: option.storage || option,
          price: option.price || ''
        })));
      }
    }
  }, [item]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      file: file,
      isExisting: false
    }));

    setProductImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setProductImages(prev => prev.filter(img => img.id !== id));
  };

  const addStorageOption = () => {
    setStorageOptions(prev => [...prev, { storage: '', price: '' }]);
  };

  const updateStorageOption = (index, field, value) => {
    setStorageOptions(prev => prev.map((option, i) =>
      i === index ? { ...option, [field]: value } : option
    ));
  };

  const removeStorageOption = (index) => {
    setStorageOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setErrorMessage('');

    try {
      const submitData = new FormData();

      // Add _method for Laravel PUT request
      submitData.append('_method', 'PUT');

      // Add form data
      Object.keys(formData).forEach(key => {
        if (key === 'in_stock' || key === 'has_storage') {
          submitData.append(key, formData[key] ? '1' : '0');
        } else if (key === 'colors') {
          // Convert comma-separated colors to array
          if (formData[key] && formData[key].trim()) {
            const colorsArray = formData[key].split(',').map(color => color.trim()).filter(color => color);
            colorsArray.forEach((color, index) => {
              submitData.append(`colors[${index}]`, color);
            });
          }
        } else if (key === 'what_is_included') {
          // Convert comma-separated items to array
          if (formData[key] && formData[key].trim()) {
            const itemsArray = formData[key].split(',').map(item => item.trim()).filter(item => item);
            itemsArray.forEach((item, index) => {
              submitData.append(`what_is_included[${index}]`, item);
            });
          }
        } else if (key === 'specification') {
          // Handle specification object as array
          if (formData[key] && typeof formData[key] === 'object') {
            Object.keys(formData[key]).forEach((specKey, index) => {
              submitData.append(`specification[${index}][key]`, specKey);
              submitData.append(`specification[${index}][value]`, formData[key][specKey]);
            });
          }
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Add storage options if enabled
      if (formData.has_storage && storageOptions.length > 0) {
        storageOptions.forEach((option, index) => {
          if (option.storage && option.price) {
            submitData.append(`storage_options[${index}][storage]`, option.storage);
            submitData.append(`storage_options[${index}][price]`, option.price);
          }
        });
      }

      // Add existing images URLs (to preserve them)
      const existingImageUrls = productImages
        .filter(img => img.isExisting)
        .map(img => img.url);

      existingImageUrls.forEach((url, index) => {
        submitData.append(`existing_images[${index}]`, url);
      });

      // Add new images
      const newImages = productImages.filter(img => !img.isExisting);
      newImages.forEach((image, index) => {
        if (image.file) {
          submitData.append(`product_images[${index}]`, image.file);
        }
      });

      const response = await fetch(`/api/admin/${item.type}s/${item.id}`, {
        method: 'POST', // Use POST with _method=PUT for FormData
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: submitData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage(`${item.type === 'deal' ? 'Deal' : 'Product'} updated successfully!`);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          setErrorMessage(result.message || 'Error updating item');
        }
      }
    } catch (error) {
      console.error('Error updating item:', error);
      setErrorMessage('Error updating item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Edit {item?.type === 'deal' ? 'Deal' : 'Product'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mx-6 mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.product_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.product_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.product_name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.category_id[0]}</p>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price[0]}</p>
                )}
              </div>

              {item?.type === 'deal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Old Price</label>
                  <input
                    type="number"
                    name="old_price"
                    value={formData.old_price}
                    onChange={handleInputChange}
                    step="0.01"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.old_price ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.old_price && (
                    <p className="mt-1 text-sm text-red-600">{errors.old_price[0]}</p>
                  )}
                </div>
              )}
            </div>

            {/* Status and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="product_status"
                  value={formData.product_status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="new">New</option>
                  <option value="uk_used">UK Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="in_stock"
                    checked={formData.in_stock}
                    onChange={handleInputChange}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">In Stock</span>
                </label>
              </div>
            </div>

            {/* Product Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>

              {/* Image Upload */}
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">Upload multiple images for the product</p>
              </div>

              {/* Image Preview */}
              {productImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {productImages.map((image) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.url}
                        alt="Product"
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                      {image.isExisting && (
                        <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Existing
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Colors</label>
              <input
                type="text"
                name="colors"
                value={formData.colors}
                onChange={handleInputChange}
                placeholder="e.g., Black, White, Gold (comma-separated)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">Enter colors separated by commas</p>
            </div>

            {/* What's Included */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What's Included</label>
              <input
                type="text"
                name="what_is_included"
                value={formData.what_is_included}
                onChange={handleInputChange}
                placeholder="e.g., Charger, USB Cable, Manual (comma-separated)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">Enter items separated by commas</p>
            </div>

            {/* Storage Options */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="has_storage"
                    checked={formData.has_storage}
                    onChange={handleInputChange}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Has Storage Options</span>
                </label>
              </div>

              {formData.has_storage && (
                <div className="space-y-3">
                  {storageOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        placeholder="Storage size (e.g., 128GB)"
                        value={option.storage}
                        onChange={(e) => updateStorageOption(index, 'storage', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={option.price}
                        onChange={(e) => updateStorageOption(index, 'price', e.target.value)}
                        step="0.01"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeStorageOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addStorageOption}
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add Storage Option
                  </button>
                </div>
              )}
            </div>

            {/* Descriptions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overview</label>
              <textarea
                name="overview"
                value={formData.overview}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">About</label>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Updating...' : `Update ${item?.type === 'deal' ? 'Deal' : 'Product'}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductEdit;
