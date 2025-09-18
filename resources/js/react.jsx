import React from 'react';
import { createRoot } from 'react-dom/client';

// Import all components
import Cart from './components/Cart.jsx';
import CartPage from './components/CartPage.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import SearchBar from './components/SearchBar.jsx';
import CheckoutPage from './components/CheckoutPage.jsx';
import CartCounter from './components/CartCounter.jsx';

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
};

// Function to initialize React components
function initializeReactComponents() {
  console.log('Initializing React components...');

  // Make cart store available globally for Alpine.js integration
  window.useCartStore = useCartStore;

  // Find all elements with data-react-component attribute
  const reactElements = document.querySelectorAll('[data-react-component]');
  console.log('Found React elements:', reactElements.length);

  reactElements.forEach(element => {
    const componentName = element.getAttribute('data-react-component');
    console.log('Initializing component:', componentName);
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

      console.log('Component props:', props);

      // Create React root and render component
      const root = createRoot(element);
      root.render(<Component {...props} />);
      console.log('Component rendered successfully:', componentName);
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

// Export components for direct use
export {
  Cart,
  CartPage,
  ProductGrid,
  SearchBar,
  CheckoutPage,
};
