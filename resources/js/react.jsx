console.log('🚨 REACT.JSX FILE IS LOADING!');

import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('✅ React and ReactDOM imported successfully');

// Import stores first (most likely to work)
import useCartStore from './stores/cartStore.js';
console.log('✅ useCartStore imported');

// Try importing one component to test
import ProductGrid from './components/ProductGrid.jsx';
console.log('✅ ProductGrid imported');

// Import other essential components
import SearchBar from './components/SearchBar.jsx';
console.log('✅ SearchBar imported');

import ProductShow from './components/ProductShow.jsx';
console.log('✅ ProductShow imported');

// Import cart components
import CartPage from './components/CartPage.jsx';
console.log('✅ CartPage imported');

import CartCounter from './components/CartCounter.jsx';
console.log('✅ CartCounter imported');

import Cart from './components/Cart.jsx';
console.log('✅ Cart imported');

// Import checkout component
import CheckoutPage from './components/CheckoutPage.jsx';
console.log('✅ CheckoutPage imported');

// Import lazy-loaded admin components
import {
    LazyAdminDashboard,
    LazyAdminLogin,
    LazyAdminProductManager,
    LazyAdminSalesManager,
    LazyAdminOrderManager
} from './components/admin/LazyAdminComponents.jsx';
console.log('✅ Lazy admin components imported');

console.log('React.jsx: Starting React initialization');

// Component registry
const components = {
  ProductGrid,
  SearchBar,
  ProductShow,
  CartPage,
  CartCounter,
  Cart,
  CheckoutPage,
  AdminDashboard: LazyAdminDashboard,
  AdminLogin: LazyAdminLogin,
  AdminProductManager: LazyAdminProductManager,
  AdminSalesManager: LazyAdminSalesManager,
  AdminOrderManager: LazyAdminOrderManager,
};

console.log('✅ Component registry created:', Object.keys(components));

// Function to initialize React components
function initializeReactComponents() {
  console.log('🚀 initializeReactComponents function called!');

  // Make cart store available globally for Alpine.js integration
  window.useCartStore = useCartStore;
  console.log('✅ Cart store made available globally');

  // Find all elements that need React components
  const reactElements = document.querySelectorAll('[data-react-component]');
  console.log(`🔍 Found ${reactElements.length} React component elements:`, reactElements);

  reactElements.forEach(element => {
    const componentName = element.getAttribute('data-react-component');
    console.log(`[React Init] Found component: ${componentName}`, element);

    console.log(`🔍 Checking if component "${componentName}" exists in registry...`);
    console.log('Available components:', Object.keys(components));

    if (components[componentName]) {
      console.log(`✅ Component ${componentName} found in registry`);

      // Extract props from data-prop-* attributes
      const props = {};
      for (let attr of element.attributes) {
        if (attr.name.startsWith('data-prop-')) {
          const propName = attr.name.substring(10); // Remove 'data-prop-'
          props[propName] = attr.value;
          console.log(`[React Init] Extracted prop: ${propName} = "${attr.value}"`);
        }
      }

      console.log(`[React Init] Final props for ${componentName}:`, props);

      try {
        console.log(`🚀 Attempting to render ${componentName}...`);
        const root = ReactDOM.createRoot(element);
        root.render(React.createElement(components[componentName], props));
        console.log(`✅ Successfully rendered ${componentName}`);
      } catch (error) {
        console.error(`❌ Error rendering ${componentName}:`, error);
      }
    } else {
      console.warn(`❌ Component ${componentName} not found in registry. Available components:`, Object.keys(components));
    }
  });
}

// Initialize when DOM is ready
console.log('🚀 Setting up React initialization!');
console.log('🔍 Document ready state:', document.readyState);

if (document.readyState === 'loading') {
  console.log('📅 Document still loading, adding DOMContentLoaded listener');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📅 DOMContentLoaded event fired, initializing React components');
    initializeReactComponents();
  });
} else {
  console.log('📅 Document already loaded, initializing React components immediately');
  initializeReactComponents();
}

// Also expose for manual initialization
window.initializeReactComponents = initializeReactComponents;

// Add specific initializer for ProductShow
window.initProductShow = (props) => {
  console.log('🚀 initProductShow called with props:', props);
  const container = document.getElementById('product-show-root');
  if (container && components.ProductShow) {
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(components.ProductShow, props));
    console.log('✅ ProductShow component rendered with props:', props);
  } else {
    console.error('❌ ProductShow container or component not found', { container, ProductShow: components.ProductShow });
  }
};

console.log('🎉 React.jsx setup complete!');

// Export components for direct use
export {
  ProductGrid,
  SearchBar,
  ProductShow,
};
