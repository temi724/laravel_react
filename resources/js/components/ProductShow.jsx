import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight2, Bank, ExportCurve, Gallery, ShoppingCart, Shop, TickCircle, TruckFast } from 'iconsax-react';
import useCartStore from '../stores/cartStore';
import useOffersStore from '../stores/offersStore';
import Countdown from './Countdown';
import { formatMoment, holdFor, leftAtPrice, orderLimit, promoFor } from '../lib/offers';
import ProductCard from './ProductCard';
import { colorName, conditionLabel, discountPercent, formatPrice } from '../lib/format';
import { showToast } from '../lib/toast';
import store from '../lib/store';

const SWATCHES = {
  midnight: '#1c1c1e',
  starlight: '#f4efe6',
  blue: '#2563eb',
  purple: '#8b5cf6',
  pink: '#ec4899',
  red: '#dc2626',
  orange: '#f97316',
  yellow: '#facc15',
  green: '#16a34a',
  black: '#111111',
  white: '#ffffff',
  gray: '#8e8e93',
  grey: '#8e8e93',
  silver: '#c7c9cc',
  gold: '#d4af37',
  rose: '#f4a6b7',
  cyan: '#06b6d4',
  navy: '#1e3a8a',
  brown: '#8b5a2b',
  lime: '#84cc16',
};

const specValue = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value;
};

const specLabel = (key) => String(key).replace(/_/g, ' ');

// What is chosen when a product first shows: its first colour, its default size and that size's price
const firstChoices = (data) => ({
  color: data?.colors?.length > 0 ? colorName(data.colors[0]) : '',
  storage: data?.storage_options?.length > 0 ? data.default_storage || data.storage_options[0].storage : '',
  price: data?.display_price ?? 0,
});

// `initial` is the product itself, sent with the page (a JSON string in a data-prop attribute).
// With it the page shows at once, with no request and no loading state; without it the
// product is fetched by its id.
const ProductShow = ({ productid, producttype = 'product', initial = '' }) => {
  const [sent] = useState(() => {
    try {
      const data = initial ? JSON.parse(initial) : null;
      return data && String(data.id) === String(productid) ? data : null;
    } catch (error) {
      console.error('ProductShow could not read its product:', error);
      return null;
    }
  });

  const [product, setProduct] = useState(sent);
  const [type, setType] = useState(sent?.type || producttype);
  const [loading, setLoading] = useState(!sent);
  const [error, setError] = useState(null);

  // Component state
  const [currentImage, setCurrentImage] = useState(0);
  const [failedImages, setFailedImages] = useState({});
  const [selectedColor, setSelectedColor] = useState(() => firstChoices(sent).color);
  const [selectedStorage, setSelectedStorage] = useState(() => firstChoices(sent).storage);
  const [selectedPrice, setSelectedPrice] = useState(() => firstChoices(sent).price);
  const [activeTab, setActiveTab] = useState('about');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [buyRowVisible, setBuyRowVisible] = useState(true);
  const buyRowRef = useRef(null);

  // Cart store
  const { addToCart, isLoading: cartLoading } = useCartStore();
  const offers = useOffersStore((state) => state.data);
  const refreshOffers = useOffersStore((state) => state.refresh);

  // Fetch product data
  useEffect(() => {
    if (!productid) {
      setError('No product ID provided');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        let data = sent;

        if (!data) {
          setLoading(true);
          const response = await fetch(`/api/products/${productid}`);
          if (!response.ok) throw new Error(`Request failed with ${response.status}`);
          data = await response.json();
        }

        if (data) {
          if (!sent) {
            const choices = firstChoices(data);
            setProduct(data);
            setType(data.type || producttype);
            setSelectedColor(choices.color);
            if (choices.storage) setSelectedStorage(choices.storage);
            setSelectedPrice(choices.price);
          }

          // Track product view for analytics
          if (window.trackProductView) {
            window.trackProductView(data.id, data.product_name);
          }

          // Fetch related products
          if (data.category_id) {
            const relatedResponse = await fetch(`/api/products/category/${data.category_id}?exclude=${productid}&limit=6`);
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

    fetchProduct();
  }, [productid, producttype, sent]);

  // The bottom bar on phones only appears once the main buy button has scrolled away
  useEffect(() => {
    const row = buyRowRef.current;
    if (!row) return undefined;

    const observer = new IntersectionObserver((entries) => setBuyRowVisible(entries[0].isIntersecting));
    observer.observe(row);
    return () => observer.disconnect();
  }, [product]);

  // Update price when storage changes
  const updatePrice = (storage, price) => {
    setSelectedStorage(storage);
    setSelectedPrice(price);
  };

  // A deal of the day or a live drop on the chosen size changes the price;
  // a drop that has not started holds the product back until it does
  const promo = product && type === 'product' ? promoFor(offers, product.id, selectedStorage) : null;
  const hold = product && type === 'product' ? holdFor(offers, product.id) : null;
  const price = promo ? promo.price : selectedPrice;

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCart(
        product.id,
        1,
        type,
        selectedStorage,
        price,
        selectedColor,
        { ...product, price } // Pass the product data directly, at the price that applies now
      );

      // Track add to cart event for analytics
      if (window.trackCheckoutEvent) {
        window.trackCheckoutEvent(
          'cart_view',
          {
            id: product.id,
            name: product.product_name,
            price,
            quantity: 1,
            storage: selectedStorage,
            color: selectedColor,
          },
          price
        );
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const handleShare = async () => {
    const shareData = { title: product.product_name, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showToast('Link copied');
      }
    } catch (err) {
      // The share sheet was dismissed; nothing to report
      if (err?.name !== 'AbortError') console.error('Error sharing product:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="grid animate-pulse grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12" aria-busy="true" aria-label="Loading product">
        <div className="aspect-square rounded-3xl bg-gray-200/70" />
        <div className="space-y-4 pt-2">
          <div className="h-5 w-24 rounded-full bg-gray-200/70" />
          <div className="h-9 w-4/5 rounded-full bg-gray-200/70" />
          <div className="h-9 w-2/5 rounded-full bg-gray-200/70" />
          <div className="h-12 w-full rounded-full bg-gray-200/70" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="panel mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">We could not find this product</h1>
        <p className="mt-2 text-sm text-gray-600">It may have been removed, or the link is incorrect.</p>
        <a href="/" className="btn btn-primary mt-6">
          Back to the store
        </a>
      </div>
    );
  }

  const details = store();
  const images = Array.isArray(product.images_url) ? product.images_url : [];
  const mainImage = images[currentImage];
  const discount = type === 'deal' ? discountPercent(product.old_price, product.price) : 0;
  const categoryUrl = product.category?.slug ? `/category/${product.category.slug}` : '/products';
  const included = Array.isArray(product.what_is_included)
    ? product.what_is_included
    : String(product.what_is_included || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
  const features = String(product.about || '')
    .split('.')
    .map((feature) => feature.trim())
    .filter(Boolean);
  const specification =
    product.specification && typeof product.specification === 'object' && Object.keys(product.specification).length > 0
      ? product.specification
      : null;
  const flatSpecs = specification ? Object.entries(specification).filter(([, value]) => typeof value !== 'object' || Array.isArray(value)) : [];
  const groupedSpecs = specification
    ? Object.entries(specification).filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value))
    : [];
  const isPhone = /phone/i.test(product.product_name);

  const buyButton = (className = '') => (
    <button type="button" onClick={handleAddToCart} disabled={cartLoading || !product.in_stock || Boolean(hold)} className={`btn btn-lg btn-primary ${className}`}>
      <ShoppingCart size={20} color="currentColor" variant="Linear" />
      {hold ? 'On sale at the drop' : !product.in_stock ? 'Out of stock' : cartLoading ? 'Adding' : 'Add to cart'}
    </button>
  );

  return (
    <div className="pb-20 lg:pb-0">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
          <li>
            <a href="/" className="hover:text-ink">
              Home
            </a>
          </li>
          <li aria-hidden="true">
            <ArrowRight2 size={12} color="currentColor" variant="Linear" />
          </li>
          {type === 'deal' ? (
            <li>
              <a href="/#deals" className="hover:text-ink">
                Flash deals
              </a>
            </li>
          ) : (
            product.category && (
              <li>
                <a href={categoryUrl} className="hover:text-ink">
                  {product.category.name}
                </a>
              </li>
            )
          )}
          {(type === 'deal' || product.category) && (
            <li aria-hidden="true">
              <ArrowRight2 size={12} color="currentColor" variant="Linear" />
            </li>
          )}
          <li className="max-w-[60vw] truncate text-ink" aria-current="page">
            {product.product_name}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        {/* Product images */}
        <div className="lg:sticky lg:top-36 lg:self-start">
          <div className="panel flex aspect-square items-center justify-center overflow-hidden">
            {mainImage && !failedImages[currentImage] ? (
              <img
                key={mainImage}
                src={mainImage}
                alt={`${product.product_name}, image ${currentImage + 1} of ${images.length}`}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onError={() => setFailedImages((failed) => ({ ...failed, [currentImage]: true }))}
                className="size-full animate-fade object-contain p-4 sm:p-8"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-300">
                <Gallery size={48} color="currentColor" variant="Linear" />
                <p className="mt-3 text-sm font-medium text-gray-500">No photo yet</p>
              </div>
            )}
          </div>

          {/* Image thumbnails */}
          {images.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto p-0.5">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setCurrentImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={currentImage === index}
                  className={`flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-white text-gray-300 transition-colors sm:size-20 ${
                    currentImage === index ? 'border-ink' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {failedImages[index] ? (
                    <Gallery size={20} color="currentColor" variant="Linear" />
                  ) : (
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={() => setFailedImages((failed) => ({ ...failed, [index]: true }))}
                      className="size-full object-contain p-1"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-200/70 px-3 py-1 text-xs font-semibold">{conditionLabel(product.product_status)}</span>
            {product.in_stock ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600">
                <TickCircle size={16} color="currentColor" variant="Linear" />
                In stock
              </span>
            ) : (
              <span className="rounded-full bg-sale-light px-3 py-1 text-xs font-semibold text-sale">Out of stock</span>
            )}
          </div>

          <h1 className="mt-3 text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">{product.product_name}</h1>

          {type === 'product' && product.category && (
            <p className="mt-2 text-sm text-gray-600">
              In{' '}
              <a href={categoryUrl} className="font-semibold text-brand hover:text-brand-dark">
                {product.category.name}
              </a>
            </p>
          )}

          {/* Price. A crossed-out price only appears on deals, where a real old price exists. */}
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">{formatPrice(price)}</span>
            {promo && (
              <>
                <s className="text-lg text-gray-500 tabular-nums">{formatPrice(promo.usual_price ?? selectedPrice)}</s>
                <span className="rounded-full bg-sale-light px-2.5 py-1 text-xs font-bold text-sale">{promo.label}</span>
              </>
            )}
            {discount > 0 && (
              <>
                <s className="text-lg text-gray-500 tabular-nums">{formatPrice(product.old_price)}</s>
                <span className="rounded-full bg-sale-light px-2.5 py-1 text-xs font-bold text-sale">Save {discount}%</span>
              </>
            )}
          </div>
          {type === 'deal' && <p className="mt-1 text-sm text-gray-600">Flash deal, while stock lasts.</p>}

          {/* The offer running on this product, or the drop it is waiting for */}
          {promo && (
            <div className="mt-3 rounded-2xl bg-sale-light px-4 py-3 text-sm">
              {promo.ends_at && (
                <p className="font-semibold text-sale">
                  {(promo.usual_price ?? selectedPrice) > promo.price ? `Back to ${formatPrice(promo.usual_price ?? selectedPrice)} in` : 'This price ends in'}{' '}
                  <Countdown to={promo.ends_at} onDone={refreshOffers} />
                </p>
              )}
              <p className="text-gray-700">
                {[
                  leftAtPrice(promo.remaining),
                  orderLimit(promo.per_order_limit),
                  // Units are counted when the order is placed, so the cart does not hold one
                  promo.remaining !== null ? 'A unit is yours once you place the order, not while it sits in your cart' : null,
                  !promo.ends_at && promo.remaining === null ? 'While the offer lasts' : null,
                ]
                  .filter(Boolean)
                  .join('. ')}
                .
              </p>
            </div>
          )}
          {hold && (
            <div className="mt-3 rounded-2xl bg-brand-light px-4 py-3 text-sm">
              <p className="font-semibold text-brand">
                Drops {formatMoment(hold.starts_at)}, in <Countdown to={hold.starts_at} onDone={refreshOffers} />
              </p>
              <p className="text-gray-700">
                {hold.quantity_limit} {hold.quantity_limit === 1 ? 'unit' : 'units'} at {formatPrice(hold.price)}
                {hold.usual_price > hold.price ? `, ${formatPrice(hold.usual_price - hold.price)} below the usual price` : ''}. First come, first served from the moment it opens.
              </p>
            </div>
          )}

          {/* Colour selection */}
          {Array.isArray(product.colors) && product.colors.length > 0 && (
            <fieldset className="mt-7">
              <legend className="text-sm font-semibold">
                Colour <span className="font-medium text-gray-600 capitalize">{selectedColor}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((color, index) => {
                  const name = colorName(color);
                  const swatch = SWATCHES[name.toLowerCase()];

                  return (
                    <button
                      key={`${name}-${index}`}
                      type="button"
                      onClick={() => setSelectedColor(name)}
                      aria-pressed={selectedColor === name}
                      className={`chip h-10 capitalize ${selectedColor === name ? 'chip-active' : ''}`}
                    >
                      {swatch && <span className="size-4 rounded-full border border-gray-300" style={{ backgroundColor: swatch }} />}
                      {name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Storage options */}
          {Array.isArray(product.storage_options) && product.storage_options.length > 0 && (
            <fieldset className="mt-7">
              <legend className="text-sm font-semibold">
                Storage <span className="font-medium text-gray-600">{selectedStorage}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.storage_options.map((option, index) => {
                  const active = selectedStorage === option.storage;

                  return (
                    <button
                      key={`${option.storage}-${index}`}
                      type="button"
                      onClick={() => updatePrice(option.storage, option.price)}
                      aria-pressed={active}
                      className={`flex flex-col rounded-2xl border px-4 py-2.5 text-left transition-[transform,background-color,border-color] duration-200 ease-out active:scale-[0.97] ${
                        active ? 'border-brand bg-brand-light' : 'border-gray-200 bg-white hover:border-gray-400'
                      }`}
                    >
                      <span className={`text-sm font-semibold ${active ? 'text-brand' : ''}`}>{option.storage}</span>
                      <span className="text-xs text-gray-600 tabular-nums">{formatPrice(option.price)}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Buy */}
          <div ref={buyRowRef} className="mt-8 flex gap-2">
            {buyButton('flex-1')}
            <button type="button" onClick={handleShare} className="btn btn-lg btn-outline px-4" aria-label="Share this product">
              <ExportCurve size={20} color="currentColor" variant="Linear" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          {/* What to expect */}
          <ul className="mt-6 space-y-3 rounded-3xl bg-white p-5 text-sm">
            <li className="flex items-center gap-3">
              <Shop size={20} color="currentColor" variant="Linear" className="shrink-0 text-gray-500" />
              <span>
                Pick up at {details.address.line}, Ikeja
              </span>
            </li>
            <li className="flex items-center gap-3">
              <TruckFast size={20} color="currentColor" variant="Linear" className="shrink-0 text-gray-500" />
              <span>Delivery to all states, ships in 1 to 2 business days</span>
            </li>
            <li className="flex items-center gap-3">
              <Bank size={20} color="currentColor" variant="Linear" className="shrink-0 text-gray-500" />
              <span>Pay by bank transfer at checkout</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Product details */}
      <section className="mt-12 lg:mt-16" aria-label="Product details">
        <div className="inline-flex rounded-full bg-gray-200/70 p-1" role="tablist">
          {[
            { id: 'about', label: 'About this product' },
            { id: 'specs', label: 'Specifications' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors ${
                activeTab === tab.id ? 'bg-white text-ink' : 'text-gray-600 hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="panel mt-4 p-5 sm:p-8">
          {/* Both panels are always in the page and the one not chosen is hidden: the
              specifications can then be read by search engines, not only by whoever opens the tab */}
          {(
            <div id="panel-about" role="tabpanel" aria-labelledby="tab-about" className="space-y-8" hidden={activeTab !== 'about'}>
              {included.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold">What is included</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {included.map((item, index) => (
                      <li key={`${item}-${index}`} className="rounded-full bg-gray-100 px-3.5 py-1.5 text-sm">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.description && (
                <div>
                  <h2 className="text-lg font-bold">Description</h2>
                  <p className="mt-3 max-w-[70ch] leading-relaxed whitespace-pre-line text-gray-700">{product.description}</p>
                </div>
              )}

              {features.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold">Key features</h2>
                  <ul className="mt-3 grid max-w-4xl grid-cols-1 gap-x-8 gap-y-2.5 md:grid-cols-2">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-gray-700">
                        <TickCircle size={18} color="currentColor" variant="Linear" className="mt-1 shrink-0 text-brand" />
                        <span>{feature}.</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isPhone && (
                <div className="max-w-[70ch] rounded-2xl bg-gray-100 p-5">
                  <h2 className="font-bold">How do unlocked phones work?</h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">
                    Purchasing an unlocked handset gives you more handset options to choose from and more flexibility as to where you use it.
                    Because an unlocked handset isn't tied to a particular service provider, it can be used with any service provider in
                    the world that operates on a SIM card-based GSM network.
                  </p>
                </div>
              )}

              {included.length === 0 && !product.description && features.length === 0 && (
                <p className="text-sm text-gray-600">There is no description for this product yet. Message us on WhatsApp and we will answer any question.</p>
              )}
            </div>
          )}

          {(
            <div id="panel-specs" role="tabpanel" aria-labelledby="tab-specs" hidden={activeTab !== 'specs'}>
              {specification ? (
                <div className="space-y-8">
                  {flatSpecs.length > 0 && (
                    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {flatSpecs.map(([key, value]) => (
                        <div key={key} className="rounded-2xl bg-gray-50 px-4 py-3">
                          <dt className="text-xs text-gray-500 capitalize">{specLabel(key)}</dt>
                          <dd className="mt-0.5 text-sm font-semibold">{specValue(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {groupedSpecs.map(([group, specs]) => (
                    <div key={group}>
                      <h2 className="text-lg font-bold capitalize">{specLabel(group)}</h2>
                      <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(specs).map(([key, value]) => (
                          <div key={key} className="rounded-2xl bg-gray-50 px-4 py-3">
                            <dt className="text-xs text-gray-500 capitalize">{specLabel(key)}</dt>
                            <dd className="mt-0.5 text-sm font-semibold">{specValue(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Specifications for this product have not been added yet.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12 lg:mt-16">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight">{product.category ? `More in ${product.category.name}` : 'More products'}</h2>
            <a href={categoryUrl} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark">
              View all
              <ArrowRight2 size={14} color="currentColor" variant="Linear" />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
            {relatedProducts.slice(0, 6).map((relatedProduct, index) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Buy bar for phones. It slides up once the main button is out of view. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out motion-reduce:transition-none lg:hidden ${
          buyRowVisible ? 'translate-y-full' : 'translate-y-0'
        }`}
        inert={buyRowVisible}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-gray-600">{product.product_name}</p>
            <p className="text-lg leading-6 font-extrabold tracking-tight tabular-nums">{formatPrice(price)}</p>
          </div>
          {buyButton('shrink-0')}
        </div>
      </div>
    </div>
  );
};

export default ProductShow;
