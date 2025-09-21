import React from 'react';
import { createRoot } from 'react-dom/client';

// Import all components
import Cart from './components/Cart.jsx';
import CartPage from './components/CartPage.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import SearchBar from './components/SearchBar.jsx';
import CheckoutPage from './components/CheckoutPage.jsx';
import CartCounter from './components/CartCounter.jsx';
import ProductShow from './components/ProductShow.jsx';

// Import admin components
import AdminLogin from './components/admin/AdminLogin.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import AdminProductManager from './components/admin/AdminProductManager.jsx';
import AdminSalesManager from './components/admin/AdminSalesManager.jsx';
import AdminOrderManager from './components/admin/AdminOrderManager.jsx';

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
  // Admin components
  AdminLogin,
  AdminDashboard,
  AdminProductManager,
  AdminSalesManager,
  AdminOrderManager,
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
  // Admin components
  AdminLogin,
  AdminDashboard,
  AdminProductManager,
  AdminSalesManager,
  AdminOrderManager,
};
