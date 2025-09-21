import React, { useState, useEffect } from 'react';
import useCartStore from '../stores/cartStore';

const ProductShow = ({ productid, producttype = 'product' }) => {
  console.log('ProductShow component initialized with:', { productid, producttype });

  // Currency formatting function to ensure thousands separators
  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return `₦${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Early return for debugging
  if (!productid) {
    return (
      <div style={{ padding: '20px', background: '#ffe6e6', border: '1px solid #ff0000' }}>
        <h2>ProductShow Component Error</h2>
        <p>No productid provided. Props received: {JSON.stringify({ productid, producttype })}</p>
      </div>
    );
  }

  const [product, setProduct] = useState(null);
  const [type, setType] = useState(producttype);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Component state
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [activeTab, setActiveTab] = useState('about');
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Cart store
  const { addToCart, isLoading: cartLoading } = useCartStore();

  // Fetch product data
  useEffect(() => {
    console.log('ProductShow useEffect triggered with productid:', productid);
    if (!productid) {
      console.error('No productid provided to ProductShow component');
      setError('No product ID provided');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        console.log('Fetching product data for ID:', productid);
        const response = await fetch(`/api/products/${productid}`);
        console.log('API response status:', response.status);
        const data = await response.json();
        console.log('API response data:', data);

        if (data) {
          setProduct(data);
          setType(data.type || producttype);

          // Track product view for analytics
          if (window.trackProductView) {
            window.trackProductView(data.id, data.product_name);
          }

          // Initialize color selection
          if (data.colors && data.colors.length > 0) {
            const firstColor = data.colors[0];
            const colorName = typeof firstColor === 'object' ?
              (firstColor.name || Object.values(firstColor)[0] || '') : firstColor;
            setSelectedColor(colorName);
          }

          // Initialize storage selection
          if (data.storage_options && data.storage_options.length > 0) {
            setSelectedStorage(data.default_storage || data.storage_options[0].storage);
            setSelectedPrice(data.display_price);
          } else {
            setSelectedPrice(data.display_price);
          }

          // Fetch related products
          if (data.category_id) {
            const relatedResponse = await fetch(`/api/products/category/${data.category_id}?exclude=${productid}&limit=8`);
            const relatedData = await relatedResponse.json();
            setRelatedProducts(relatedData.data || relatedData || []);
          }
        }
      } catch (err) {
        setError('Failed to load product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productid) {
      fetchProduct();
    }
  }, [productid, producttype]);

  // Color swatch generator
  const getColorSwatch = (colorName) => {
    const lower = colorName.toLowerCase();
    const colorMap = {
      'midnight': '#000000',
      'starlight': '#f9f9f9',
      'blue': '#007AFF',
      'purple': '#AF52DE',
      'pink': '#FF2D92',
      'red': '#FF3B30',
      'orange': '#FF8C00',
      'yellow': '#FFD700',
      'green': '#32D74B',
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#8E8E93',
      'grey': '#8E8E93',
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'rose': '#FF69B4',
      'cyan': '#00FFFF',
      'navy': '#000080',
      'brown': '#8B4513',
      'lime': '#32CD32',
    };

    return colorMap[lower] || `#${colorName.slice(0, 6).padEnd(6, '0')}`;
  };

  // Update price when storage changes
  const updatePrice = (storage, price) => {
    setSelectedStorage(storage);
    setSelectedPrice(price);
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCart(
        product.id,
        1,
        type,
        selectedStorage,
        selectedPrice,
        selectedColor,
        product  // Pass the product data directly
      );

      // Track add to cart event for analytics
      if (window.trackCheckoutEvent) {
        window.trackCheckoutEvent('cart_view', {
          id: product.id,
          name: product.product_name,
          price: selectedPrice,
          quantity: 1,
          storage: selectedStorage,
          color: selectedColor
        }, selectedPrice);
      }

      // Show success feedback
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white font-medium bg-green-500 transition-all duration-300';
      toast.textContent = 'Added to cart successfully!';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 xl:gap-16">
            <div className="aspect-square bg-gray-200 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The product you are looking for does not exist.'}</p>
          <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><a href="/" className="hover:text-blue-600">Home</a></li>
          <li><span>/</span></li>
          {type === 'product' && product.category && (
            <>
              <li>
                <a href={`/?category=${product.category.id}`} className="hover:text-blue-600">
                  {product.category.name}
                </a>
              </li>
              <li><span>/</span></li>
            </>
          )}
          {type === 'deal' && (
            <>
              <li><a href="#deals" className="hover:text-blue-600">Flash Deals</a></li>
              <li><span>/</span></li>
            </>
          )}
          <li className="text-gray-900">{product.product_name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 xl:gap-16">
        {/* Product Images Section */}
        <div className="lg:sticky lg:top-8">
          <div className="space-y-4">
            {/* Main Image Display */}
            <div className="aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {product.images_url && product.images_url.length > 0 ? (
                product.images_url.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={product.product_name}
                    loading={index === 0 ? "eager" : "lazy"} // Load first image immediately, others lazily
                    className={`w-full h-full object-contain p-4 sm:p-8 cursor-zoom-in transition-opacity duration-300 ${
                      currentImage === index ? 'opacity-100' : 'opacity-0 absolute inset-0'
                    }`}
                    style={{ display: currentImage === index ? 'block' : 'none' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling?.style.setProperty('display', 'flex');
                    }}
                  />
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p className="text-gray-400 text-sm font-medium">No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {product.images_url && product.images_url.length > 1 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
                {product.images_url.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`flex-shrink-0 w-12 h-12 bg-white rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                      currentImage === index
                        ? 'border-blue-500 ring-2 ring-blue-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.product_name} thumbnail`}
                      loading="lazy"
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image Controls */}
            {product.images_url && product.images_url.length > 0 && (
              <div className="flex gap-2">
                <button className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 22L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15.5 11.5H15.5093" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.5 7.5V7.5093" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.5 11.5H7.5093" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.5 15.5V15.5093" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Zoom
                </button>
                <button className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-gray-600 hover:text-gray-700 text-xs sm:text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.5 12L17.5 12M17.5 12L14.5 15M17.5 12L14.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Share
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Info Section */}
        <div className="space-y-4 lg:space-y-6">
          {/* Product Title */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <span>Brand:</span>
              <span className="font-medium text-blue-600">
                {product.product_name.split(' ')[0] || 'Generic'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {product.product_name}
              </h1>
              {type === 'deal' && product.old_price && product.old_price > product.price && (
                <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-md shadow-md">
                  -{Math.round(((product.old_price - product.price) / product.old_price) * 100)}% OFF
                </span>
              )}
            </div>

            {type === 'product' && product.category ? (
              <p className="text-sm text-gray-500">
                Category:{' '}
                <a href={`/?category=${product.category.id}`} className="text-blue-600 hover:underline">
                  {product.category.name}
                </a>
              </p>
            ) : type === 'deal' ? (
              <p className="text-sm text-gray-500">
                Category: <span className="text-blue-600">Flash Deal</span>
              </p>
            ) : null}
          </div>

          {/* Pricing Section */}
          <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6">
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
              <span id="current-price" className="text-2xl sm:text-3xl font-bold text-red-600">
                {formatCurrency(selectedPrice)}
              </span>
              {type === 'deal' && product.old_price && product.old_price > product.price ? (
                <>
                  <span className="text-base sm:text-lg text-gray-500 line-through">
                    {formatCurrency(product.old_price)}
                  </span>
                  <span className="bg-red-100 text-red-800 text-xs sm:text-sm font-medium px-1.5 sm:px-2 py-1 rounded">
                    SAVE {formatCurrency(product.old_price - product.price)}
                  </span>
                </>
              ) : type === 'product' && selectedPrice > 500 ? (
                <>
                  <span id="old-price" className="text-base sm:text-lg text-gray-500 line-through">
                    {formatCurrency(selectedPrice * 1.2)}
                  </span>
                  <span id="savings" className="bg-red-100 text-red-800 text-xs sm:text-sm font-medium px-1.5 sm:px-2 py-1 rounded">
                    SAVE {formatCurrency(selectedPrice * 0.2)}
                  </span>
                </>
              ) : null}
            </div>
            {type === 'deal' ? (
              <p className="text-sm text-gray-600 mt-1">⚡ Flash Deal - Limited time offer!</p>
            ) : null}
          </div>

          {/* Color Selection */}
          {product.colors && Array.isArray(product.colors) && product.colors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Colour: <span className="capitalize">{selectedColor}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color, index) => {
                  const colorName = typeof color === 'object' ?
                    (color.name || Object.values(color)[0] || '') : color;
                  const swatch = getColorSwatch(colorName);

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(colorName)}
                      className={`flex items-center space-x-2 px-4 py-2 border-2 rounded-lg transition-all duration-200 ${
                        selectedColor === colorName
                          ? 'ring-2 ring-blue-500 border-blue-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border border-gray-200"
                        style={{ backgroundColor: swatch }}
                      ></div>
                      <span className="text-sm font-medium capitalize">{colorName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Storage Options */}
          {product.storage_options && product.storage_options.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Storage: <span>{selectedStorage}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.storage_options.map((storageOption, index) => (
                  <button
                    key={index}
                    onClick={() => updatePrice(storageOption.storage, storageOption.price)}
                    className={`px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                      selectedStorage === storageOption.storage
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium">{storageOption.storage}</div>
                      <div className="text-xs text-green-600 mt-1">
                        ₦{storageOption.price.toLocaleString('en-NG', {minimumFractionDigits: 0})}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">
                {product.in_stock ? 'In Stock' : 'Limited Stock'}
              </span>
            </div>
            <div className="text-xs text-gray-500">Ships in 1-2 business days</div>
          </div>

          {/* Purchase Options */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
            {/* Add to Cart Section */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="flex-1 bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.74157 18.5545C4.94119 20 7.17389 20 11.6393 20H12.3605C16.8259 20 19.0586 20 20.2582 18.5545M3.74157 18.5545C2.54194 17.1091 2.9534 14.9146 3.77633 10.5257C4.36155 7.40452 4.65416 5.84393 5.76506 4.92196M3.74157 18.5545L5.76506 4.92196M20.2582 18.5545C21.4578 17.1091 21.0464 14.9146 20.2235 10.5257C19.6382 7.40452 19.3456 5.84393 18.2347 4.92196M20.2582 18.5545L18.2347 4.92196M18.2347 4.92196C17.1238 4 15.5361 4 12.3605 4H11.6393C8.46374 4 6.87596 4 5.76506 4.92196" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="9" cy="19.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="15" cy="19.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  {cartLoading ? 'Adding...' : 'Add to Cart'}
                </button>
                <button className="p-3 sm:p-4 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 sm:flex-shrink-0">
                  <svg className="w-5 h-5 mx-auto sm:mx-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="border-t border-gray-100 pt-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-blue-700">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="font-medium">Quick and easy store pickup available</span>
                </div>
                <div className="flex items-center gap-3 text-purple-700">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"></path>
                    </svg>
                  </div>
                  <span className="font-medium">Secure payment options available</span>
                </div>
                <div className="flex items-center gap-3 text-green-700">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="font-medium">Quality guaranteed products</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-16 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('about')}
              className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-all duration-200 -mb-px ${
                activeTab === 'about'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              About This Product
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-all duration-200 -mb-px ${
                activeTab === 'specs'
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Specifications
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[400px]">
          {/* About This Product Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              {product.what_is_included && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">What's included:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="whitespace-pre-line">
                      {Array.isArray(product.what_is_included)
                        ? product.what_is_included.join('\n')
                        : product.what_is_included}
                    </div>
                  </div>
                </div>
              )}

              {product.description && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Product Description</h3>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p>{product.description}</p>
                  </div>
                </div>
              )}

              {product.about && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h3>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <div className="space-y-3">
                      {product.about.split('.').map((feature, index) => {
                        const trimmedFeature = feature.trim();
                        return trimmedFeature ? (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <p>{trimmedFeature}.</p>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* How It Works Section */}
              {(product.product_name.toLowerCase().includes('phone') ||
                product.product_name.toLowerCase().includes('iphone')) && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">How do unlocked phones work?</h3>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <p className="text-gray-700">
                      Purchasing an unlocked handset gives you more handset options to choose from and more flexibility as to where you use it.
                      Because an unlocked handset isn't tied to a particular service provider, it can be used with any service provider in
                      the world that operates on a SIM card-based GSM network.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              {product.specification && typeof product.specification === 'object' ? (
                Object.entries(product.specification).map(([category, specs]) => (
                  <div key={category} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 capitalize">{category}</h3>
                    {typeof specs === 'object' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(specs).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-start py-2">
                            <span className="text-gray-600 font-medium capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-gray-900 text-right">
                              {Array.isArray(value)
                                ? value.join(', ')
                                : typeof value === 'boolean'
                                ? value ? 'Yes' : 'No'
                                : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-between items-start py-2">
                        <span className="text-gray-600 font-medium capitalize">
                          {category.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-gray-900 text-right">
                          {typeof specs === 'boolean' ? (specs ? 'Yes' : 'No') : specs}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No specifications available</h3>
                  <p className="mt-1 text-sm text-gray-500">Specifications for this product are not available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Products we think you'll love</h2>
            <a href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              View all products
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 8).map((relatedProduct) => (
              <div key={relatedProduct.id} className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors duration-200 group">
                <a href={`/product/${relatedProduct.id}`} className="block">
                  <div className="aspect-square bg-gray-100 rounded-t-lg relative overflow-hidden">
                    {relatedProduct.images_url && relatedProduct.images_url.length > 0 ? (
                      <img
                        src={relatedProduct.images_url[0]}
                        alt={relatedProduct.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    )}

                    {!relatedProduct.in_stock ? (
                      <div className="absolute top-3 left-3 bg-red-100 text-red-800 px-2 py-1 rounded-md text-xs font-medium">
                        Out of Stock
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3 bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                        In Stock
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {relatedProduct.category && (
                      <div className="text-[11px] uppercase tracking-wide text-blue-600 font-semibold mb-1">
                        {relatedProduct.category.name}
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {relatedProduct.product_name}
                    </h3>
                    {relatedProduct.overview && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{relatedProduct.overview}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(relatedProduct.price)}
                      </div>
                      {relatedProduct.in_stock ? (
                        <button className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors group">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 3L2.26491 3.0883C3.58495 3.52832 4.24497 3.74832 4.62248 4.2721C5 4.79587 5 5.49159 5 6.88304V9.5C5 12.7875 5 14.4312 5.90796 15.5376C6.07418 15.7401 6.25989 15.9258 6.46243 16.092C7.56878 17 9.21252 17 12.5 17C15.7875 17 17.4312 17 18.5376 16.092C18.7401 15.9258 18.9258 15.7401 19.092 15.5376C20 14.4312 20 12.7875 20 9.5V8.5C20 7.09554 20 6.39331 19.6532 5.88886C19.3065 5.38441 18.6851 5.18885 17.4422 4.79773L12.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M7.5 18C8.32843 18 9 18.6716 9 19.5C9 20.3284 8.32843 21 7.5 21C6.67157 21 6 20.3284 6 19.5C6 18.6716 6.67157 18 7.5 18Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M16.5 18.0001C17.3284 18.0001 18 18.6716 18 19.5001C18 20.3285 17.3284 21.0001 16.5 21.0001C15.6716 21.0001 15 20.3285 15 19.5001C15 18.6716 15.6716 18.0001 16.5 18.0001Z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                        </button>
                      ) : (
                        <button disabled className="w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center cursor-not-allowed">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductShow;
