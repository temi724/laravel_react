import { create } from 'zustand';
import axios from 'axios';
import useCartStore from './cartStore';

const useCheckoutStore = create((set, get) => ({
  // State
  cartItems: [],
  cartTotal: 0,
  cartCount: 0,

  // Form data
  username: '',
  email: '',
  deliveryOption: 'pickup',
  location: '',
  city: '',
  state: '',
  phone: '',
  paymentMethod: 'bank_transfer',

  // UI state
  showBankModal: false,
  isLoading: false,
  errors: {},
  generatedOrderId: null,

  // Actions
  setFormField: (field, value) => {
    set((state) => {
      const newState = {
        [field]: value,
        errors: { ...state.errors, [field]: null }, // Clear field error
      };

      // Clear location fields when switching to pickup
      if (field === 'deliveryOption' && value === 'pickup') {
        newState.location = '';
        newState.city = '';
        newState.state = '';
        // Also clear any location-related errors
        newState.errors = {
          ...newState.errors,
          location: null,
          city: null,
          state: null
        };
      }

      return newState;
    });
  },

  setErrors: (errors) => {
    set({ errors });
  },

  loadCart: async () => {
    try {
      // Get cart data from cartStore instead of API
      const cartStore = useCartStore.getState();
      const items = cartStore.cartItems;
      const total = cartStore.cartTotal;
      const count = cartStore.cartCount;

      set({
        cartItems: items,
        cartTotal: total,
        cartCount: count,
      });
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  },



  validateForm: () => {
    const state = get();
    const errors = {};

    if (!state.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!state.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(state.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!state.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    if (state.deliveryOption === 'delivery') {
      if (!state.location.trim()) {
        errors.location = 'Delivery address is required';
      }
      if (!state.city.trim()) {
        errors.city = 'City is required';
      }
      if (!state.state.trim()) {
        errors.state = 'State is required';
      }
    }

    set({ errors });
    return Object.keys(errors).length === 0;
  },

  // Generate JavaScript Order ID for faster display
  generateOrderId: () => {
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substr(2, 4).toUpperCase();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `ORD-${datePart}-${timestamp.slice(-6)}${randomPart}`;
  },

  // Show payment modal immediately without API call
  showPaymentModal: () => {
    if (!get().validateForm()) {
      return { success: false };
    }

    // Generate order ID immediately for display
    const orderId = get().generateOrderId();

    set({
      generatedOrderId: orderId,
      showBankModal: true,
      isLoading: false
    });

    return { success: true, orderId };
  },

  // Place order API call - only called after payment confirmation
  placeOrder: async () => {
    set({ isLoading: true });

    try {
      const state = get();

      const orderData = {
        username: state.username,
        email: state.email,
        deliveryOption: state.deliveryOption,
        phone: state.phone,
        paymentMethod: 'bank_transfer', // Always bank transfer
        cartItems: state.cartItems,
        cartTotal: state.cartTotal,
        orderId: state.generatedOrderId, // Use the pre-generated order ID
      };

      // Only include location fields for delivery orders
      if (state.deliveryOption === 'delivery') {
        orderData.location = state.location;
        orderData.city = state.city;
        orderData.state = state.state;
      }

      const response = await axios.post('/api/orders/place', orderData);

      if (response.data.success) {
        // Order successfully saved to database
        get().showToast('Order placed successfully! Please make payment.', 'success');
        return { success: true, orderId: response.data.orderId || state.generatedOrderId };
      } else {
        get().showToast(response.data.message || 'Error placing order', 'error');
        return { success: false };
      }
    } catch (error) {
      console.error('Error placing order:', error);

      if (error.response?.data?.errors) {
        set({ errors: error.response.data.errors });
      }

      get().showToast(
        error.response?.data?.message || 'Error placing order',
        'error'
      );

      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  // UI Actions
  openBankModal: () => set({ showBankModal: true }),
  closeBankModal: () => set({ showBankModal: false }),

  // Complete order after payment confirmation - calls API and clears cart
  completeOrder: async () => {
    try {
      // First place the order in the database
      const result = await get().placeOrder();

      if (result.success) {
        // Track purchase event
        if (window.trackCheckoutEvent) {
          window.trackCheckoutEvent('purchase', {
            order_id: result.orderId,
            total: get().cartTotal,
            items: get().cartItems.length,
            payment_method: get().paymentMethod,
            delivery_option: get().deliveryOption,
            currency: 'NGN'
          });
        }

        // Clear cart only after successful order placement
        const cartStore = useCartStore.getState();
        cartStore.clearCart();
        set({ showBankModal: false });
        get().showToast('Order confirmed and saved! Cart cleared.', 'success');
        return { success: true };
      } else {
        get().showToast('Failed to save order. Please try again.', 'error');
        return { success: false };
      }
    } catch (error) {
      console.error('Error completing order:', error);
      get().showToast('Error completing order', 'error');
      return { success: false };
    }
  },

  // Toast functionality
  showToast: (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white font-medium transition-all duration-300 transform translate-x-full ${
      type === 'error' ? 'bg-red-500' : 'bg-green-500'
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 10);

    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  },

  // Reset form
  resetForm: () => {
    set({
      username: '',
      email: '',
      deliveryOption: 'pickup',
      location: '',
      city: '',
      state: '',
      phone: '',
      paymentMethod: 'bank_transfer',
      errors: {},
      generatedOrderId: null,
      showBankModal: false,
    });
  },

  // Initialize store
  initialize: async () => {
    await get().loadCart();
  },
}));

export default useCheckoutStore;
