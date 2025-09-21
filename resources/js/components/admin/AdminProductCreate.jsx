import React, { useState, useEffect } from 'react';

const AdminProductCreate = ({ onCancel, onSuccess }) => {
  // Form state
  const [formData, setFormData] = useState({
    product_name: '',
    price: '',
    category_id: '',
    is_deal: false,
    old_price: '',
    new_price: '',
    overview: '',
    description: '',
    about: '',
    in_stock: true,
    out_of_stock: false,
    product_status: 'new',
    colors: '',
    has_storage: false,
    images_url: '',
    what_is_included: '',
    specification: ''
  });

  const [categories, setCategories] = useState([]);
  const [storageOptions, setStorageOptions] = useState([{ storage: '', price: '' }]);
  const [productImages, setProductImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle storage option changes
  const handleStorageChange = (index, field, value) => {
    const newOptions = [...storageOptions];
    newOptions[index][field] = value;
    setStorageOptions(newOptions);
  };

  const addStorageOption = () => {
    setStorageOptions([...storageOptions, { storage: '', price: '' }]);
  };

  const removeStorageOption = (index) => {
    if (storageOptions.length > 1) {
      setStorageOptions(storageOptions.filter((_, i) => i !== index));
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (productImages.length >= 3) {
      setErrorMessage('Maximum 3 images allowed');
      return;
    }

    setUploadingImages(true);
    const newImages = [];

    try {
      for (const file of files) {
        if (productImages.length + newImages.length >= 3) break;

        // Validate file type
        if (!file.type.startsWith('image/')) {
          setErrorMessage('Only image files are allowed');
          continue;
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
          setErrorMessage('Image size should be less than 2MB');
          continue;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        newImages.push({
          file,
          preview: previewUrl,
          id: Date.now() + Math.random()
        });
      }

      setProductImages(prev => [...prev, ...newImages]);
    } catch (error) {
      setErrorMessage('Error processing images');
    } finally {
      setUploadingImages(false);
      e.target.value = ''; // Reset file input
    }
  };

  const removeImage = (imageId) => {
    setProductImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      // Clean up object URLs to prevent memory leaks
      const removed = prev.find(img => img.id === imageId);
      if (removed && removed.preview.startsWith('blob:')) {
        URL.revokeObjectURL(removed.preview);
      }
      return filtered;
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setErrorMessage('');

    try {
      const submitData = new FormData();
      
      // Add form data
      Object.keys(formData).forEach(key => {
        if (key === 'is_deal' || key === 'in_stock' || key === 'out_of_stock' || key === 'has_storage') {
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
          // Convert line-separated specifications to array
          if (formData[key] && formData[key].trim()) {
            const specLines = formData[key].split('\n').map(line => line.trim()).filter(line => line);
            specLines.forEach((spec, index) => {
              // Split each line by colon to get key-value pairs
              const [specKey, ...specValueParts] = spec.split(':');
              const specValue = specValueParts.join(':').trim(); // Join back in case value contains colons
              if (specKey && specValue) {
                submitData.append(`specification[${index}][key]`, specKey.trim());
                submitData.append(`specification[${index}][value]`, specValue);
              } else {
                // If no colon, treat the whole line as a value with index as key
                submitData.append(`specification[${index}][key]`, `Item ${index + 1}`);
                submitData.append(`specification[${index}][value]`, spec);
              }
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

      // Add images
      productImages.forEach((image, index) => {
        if (image.file) {
          submitData.append(`product_images[${index}]`, image.file);
        }
      });

      const endpoint = formData.is_deal ? '/api/admin/deals' : '/api/admin/products';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: submitData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage('Product created successfully!');
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          setErrorMessage(result.message || 'Failed to create product');
        }
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setErrorMessage('An error occurred while creating the product');
    } finally {
      setLoading(false);
    }
  };

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
            <p className="mt-1 text-sm text-gray-600">Add a new product to your inventory or create a deal</p>
          </div>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            ← Back to Products
          </button>
        </div>
      </div>

      {/* Flash Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      {/* Create Form - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Product Name */}
              <div>
                <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="product_name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.product_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter product name"
                />
                {errors.product_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.product_name[0]}</p>
                )}
              </div>

              {/* Price and Category Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₦) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price[0]}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category_id"
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

              {/* Deal Toggle */}
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="is_deal"
                    checked={formData.is_deal}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">This is a deal</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">Check this if you want to create a deal with original and discounted prices</p>
              </div>

              {/* Deal Pricing (Conditional) */}
              {formData.is_deal && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-orange-800 mb-4">Deal Pricing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Price */}
                    <div>
                      <label htmlFor="old_price" className="block text-sm font-medium text-orange-700 mb-2">
                        Original Price (₦) *
                      </label>
                      <input
                        type="number"
                        id="old_price"
                        name="old_price"
                        value={formData.old_price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          errors.old_price ? 'border-red-500' : 'border-orange-300'
                        }`}
                        placeholder="0.00"
                      />
                      {errors.old_price && (
                        <p className="mt-1 text-sm text-red-600">{errors.old_price[0]}</p>
                      )}
                    </div>

                    {/* New Price */}
                    <div>
                      <label htmlFor="new_price" className="block text-sm font-medium text-orange-700 mb-2">
                        Deal Price (₦) *
                      </label>
                      <input
                        type="number"
                        id="new_price"
                        name="new_price"
                        value={formData.new_price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          errors.new_price ? 'border-red-500' : 'border-orange-300'
                        }`}
                        placeholder="0.00"
                      />
                      {errors.new_price && (
                        <p className="mt-1 text-sm text-red-600">{errors.new_price[0]}</p>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-orange-600">
                    When this is a deal, the regular price will be ignored and deal pricing will be used instead.
                  </p>
                </div>
              )}

              {/* Overview */}
              <div>
                <label htmlFor="overview" className="block text-sm font-medium text-gray-700 mb-2">
                  Overview
                </label>
                <textarea
                  id="overview"
                  name="overview"
                  value={formData.overview}
                  onChange={handleInputChange}
                  rows="3"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.overview ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Brief overview of the product"
                />
                {errors.overview && (
                  <p className="mt-1 text-sm text-red-600">{errors.overview[0]}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Detailed product description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>
                )}
              </div>

              {/* About */}
              <div>
                <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-2">
                  About
                </label>
                <textarea
                  id="about"
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="About this product"
                />
                <p className="mt-1 text-xs text-gray-500">Additional information about the product</p>
              </div>

              {/* Stock Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Status
                </label>
                <div className="space-y-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="in_stock"
                      checked={formData.in_stock}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">In Stock</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="out_of_stock"
                      checked={formData.out_of_stock}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-red-600 shadow-sm focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Out of Stock</span>
                  </label>
                </div>
              </div>

              {/* Product Status */}
              <div>
                <label htmlFor="product_status" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Status *
                </label>
                <select
                  id="product_status"
                  name="product_status"
                  value={formData.product_status}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.product_status ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="new">New</option>
                  <option value="uk_used">UK Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
                {errors.product_status && (
                  <p className="mt-1 text-sm text-red-600">{errors.product_status[0]}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Select the condition of the product</p>
              </div>

              {/* Product Images Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Images (Up to 3 images)</label>

                {/* File Upload Input */}
                <div className="mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={productImages.length >= 3}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {errors.product_images && (
                    <span className="text-red-500 text-sm">{errors.product_images[0]}</span>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {productImages.length}/3 images selected.
                    {productImages.length >= 3 ? ' Maximum reached' : ' Select one image at a time to add to your collection'}
                  </p>
                </div>

                {/* Loading indicator */}
                {uploadingImages && (
                  <div className="text-blue-500 text-sm mb-2">
                    Processing image...
                  </div>
                )}

                {/* Preview uploaded images */}
                {productImages.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {productImages.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.preview}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  • Maximum 3 images per product<br />
                  • Image files allowed (JPG, PNG, WebP)<br />
                  • Maximum file size: 2MB per image<br />
                  • Recommended dimensions: 800x800px
                </p>
              </div>

              {/* Images URLs */}
              <div>
                <label htmlFor="images_url" className="block text-sm font-medium text-gray-700 mb-2">
                  Or Enter Image URLs Manually
                </label>
                <textarea
                  id="images_url"
                  name="images_url"
                  value={formData.images_url}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter image URLs (one per line)\nhttps://example.com/image1.jpg\nhttps://example.com/image2.jpg`}
                />
                <p className="mt-1 text-xs text-gray-500">Enter one image URL per line</p>
              </div>

              {/* Colors */}
              <div>
                <label htmlFor="colors" className="block text-sm font-medium text-gray-700 mb-2">
                  Available Colors
                </label>
                <input
                  type="text"
                  id="colors"
                  name="colors"
                  value={formData.colors}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Red, Blue, Green, Black"
                />
                <p className="mt-1 text-xs text-gray-500">Enter colors separated by commas</p>
              </div>

              {/* Storage Options */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Storage Options
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="has_storage"
                      checked={formData.has_storage}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Product has storage variants</span>
                  </label>
                </div>

                {formData.has_storage && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    {storageOptions.map((option, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={option.storage}
                            onChange={(e) => handleStorageChange(index, 'storage', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 128GB, 256GB, 512GB"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">₦</span>
                            <input
                              type="number"
                              value={option.price}
                              onChange={(e) => handleStorageChange(index, 'price', e.target.value)}
                              step="0.01"
                              min="0"
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStorageOption(index)}
                          disabled={storageOptions.length <= 1}
                          className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addStorageOption}
                      className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      Add Storage Option
                    </button>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">Define different storage capacities with their prices. Leave empty if product doesn't have storage variants.</p>
              </div>

              {/* What's Included */}
              <div>
                <label htmlFor="what_is_included" className="block text-sm font-medium text-gray-700 mb-2">
                  What's Included
                </label>
                <textarea
                  id="what_is_included"
                  name="what_is_included"
                  value={formData.what_is_included}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter items included (one per line)\nProduct\nCharger\nUser Manual\nWarranty Card`}
                />
                <p className="mt-1 text-xs text-gray-500">Enter one item per line</p>
              </div>

              {/* Specifications */}
              <div>
                <label htmlFor="specification" className="block text-sm font-medium text-gray-700 mb-2">
                  Specifications
                </label>
                <textarea
                  id="specification"
                  name="specification"
                  value={formData.specification}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter specifications (one per line)\nWeight: 1.5kg\nDimensions: 20cm x 15cm x 10cm\nMaterial: Premium plastic`}
                />
                <p className="mt-1 text-xs text-gray-500">Enter one specification per line</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Sample Data Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Product Data</h3>
            <p className="text-sm text-gray-600 mb-6">Use this as a reference for filling out the form</p>

            {/* Sample Product Card */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Product Image */}
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=200&fit=crop"
                  alt="Sample Product"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Product Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">iPhone 15 Pro Max</h4>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>
                </div>

                <p className="text-2xl font-bold text-blue-600">₦1,599,000</p>

                <p className="text-sm text-gray-600 line-clamp-2">The latest flagship smartphone with advanced camera system, A17 Pro chip, and titanium design.</p>

                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Natural Titanium</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Blue Titanium</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">White Titanium</span>
                </div>
              </div>
            </div>

            {/* Sample Data Fields */}
            <div className="mt-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Sample Field Data:</h4>

                <div className="space-y-2 text-sm">
                  <div><strong>Product Name:</strong> iPhone 15 Pro Max</div>
                  <div><strong>Price:</strong> 1599000</div>
                  <div><strong>Overview:</strong> Latest flagship smartphone with premium features</div>
                  <div><strong>Description:</strong> The iPhone 15 Pro Max features the most advanced camera system, A17 Pro chip, and durable titanium design for professional photography and gaming.</div>
                  <div><strong>Product Status:</strong> new</div>
                  <div><strong>Colors:</strong> Natural Titanium, Blue Titanium, White Titanium, Black Titanium</div>
                  <div><strong>What's Included:</strong>
                    <br />• iPhone 15 Pro Max
                    <br />• USB-C to USB-C Cable
                    <br />• Documentation
                  </div>
                  <div><strong>Specifications:</strong>
                    <br />• Display: 6.7-inch Super Retina XDR
                    <br />• Chip: A17 Pro
                    <br />• Storage: 256GB, 512GB, 1TB
                    <br />• Camera: 48MP Main, 12MP Ultra Wide
                    <br />• Battery: Up to 29 hours video playback
                  </div>
                  <div><strong>Images (URLs):</strong>
                    <br />https://images.unsplash.com/photo-1583394838336-acd977736f90
                    <br />https://images.unsplash.com/photo-1592899677977-9c10ca588bbd
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use high-quality product images (recommended: 800x800px)</li>
                  <li>• Write detailed descriptions for better SEO</li>
                  <li>• Include specifications customers commonly search for</li>
                  <li>• Use comma-separated values for colors</li>
                  <li>• Enter one item per line for "What's Included"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductCreate;