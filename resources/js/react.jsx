import React from 'react';
import { createRoot } from 'react-dom/client';

// Import customer-facing components (loaded immediately as they're used more frequently)
import Cart from './components/Cart.jsx';
import CartPage from './components/CartPage.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import SearchBar from './components/SearchBar.jsx';
import CheckoutPage from './components/CheckoutPage.jsx';
import CartCounter from './components/CartCounter.jsx';
import ProductShow from './components/ProductShow.jsx';

// Import lazy admin components (loaded only when needed)
import {
  LazyAdminLogin,
  LazyAdminDashboard,
  LazyAdminProductManager,
  LazyAdminSalesManager,
  LazyAdminOrderManager,
  LazyOfflineSales,
} from './components/admin/LazyAdminComponents.jsx';

// Import stores
import useCartStore from './stores/cartStore.js';

// Component registry
const components = {
  Cart,
  CartPage,
  ProductGrid,
  SearchBar,
  CheckoutPage,
  CartCounter,
  ProductShow,
  // Admin components (lazy loaded)
  AdminLogin: LazyAdminLogin,
  AdminDashboard: LazyAdminDashboard,
  AdminProductManager: LazyAdminProductManager,
  AdminSalesManager: LazyAdminSalesManager,
  AdminOrderManager: LazyAdminOrderManager,
  OfflineSales: LazyOfflineSales,
};

// Function to initialize React components
function initializeReactComponents() {
  // Make cart store available globally for Alpine.js integration
  window.useCartStore = useCartStore;

  // Find all elements with data-react-component attribute
  const reactElements = document.querySelectorAll('[data-react-component]');

  reactElements.forEach(element => {
    const componentName = element.getAttribute('data-react-component');
    const Component = components[componentName];

    if (Component) {
      // Parse props from data attributes
      const props = {};
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('data-prop-')) {
          const propName = attr.name.replace('data-prop-', '');
          try {
            // Try to parse as JSON first, fall back to string
            props[propName] = JSON.parse(attr.value);
          } catch {
            props[propName] = attr.value;
          }
        }
      });

      // Create React root and render component
      const root = createRoot(element);
      root.render(<Component {...props} />);
    } else {
      console.warn(`React component "${componentName}" not found`);
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeReactComponents);
} else {
  initializeReactComponents();
}

// Also expose for manual initialization
window.initializeReactComponents = initializeReactComponents;

// Add specific initializer for ProductShow
window.initProductShow = (props) => {
  const container = document.getElementById('product-show-root');
  if (container && components.ProductShow) {
    const root = createRoot(container);
    root.render(<components.ProductShow {...props} />);
    console.log('ProductShow component rendered with props:', props);
  } else {
    console.error('ProductShow container or component not found');
  }
};

// Export components for direct use
export {
  Cart,
  CartPage,
  ProductGrid,
  SearchBar,
  CheckoutPage,
  ProductShow,
  // Admin components (lazy loaded)
  LazyAdminLogin as AdminLogin,
  LazyAdminDashboard as AdminDashboard,
  LazyAdminProductManager as AdminProductManager,
  LazyAdminSalesManager as AdminSalesManager,
  LazyAdminOrderManager as AdminOrderManager,
};
