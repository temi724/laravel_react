import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      cartItems: [],
      cartTotal: 0,
      cartCount: 0,
      isOpen: false,
      isLoading: false,
      _hasHydrated: false,

      // Actions
      setCartItems: (items) => {
        const total = items.reduce((sum, item) => sum + item.subtotal, 0);
        const count = items.reduce((sum, item) => sum + item.quantity, 0);

        set({
          cartItems: items,
          cartTotal: total,
          cartCount: count,
        });
      },

      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      },

      addToCart: async (itemId, quantity = 1, type = 'product', selectedStorage = null, storagePrice = null, selectedColor = null) => {
        console.log('AddToCart called with:', { itemId, quantity, type, selectedStorage, storagePrice, selectedColor });
        set({ isLoading: true });

        try {
          // First get the product details
          console.log('Fetching product details for ID:', itemId);
          const productResponse = await axios.get(`/api/products/${itemId}`);
          console.log('Product response:', productResponse.data);
          const product = productResponse.data;

          if (!product) {
            throw new Error('Product not found');
          }

          const currentCart = get().cartItems;
          console.log('Current cart before adding:', currentCart);
          console.log('Looking for existing item with:', { itemId, selectedStorage, selectedColor });
          const existingItemIndex = currentCart.findIndex(item => {
            const match = item.id === itemId &&
              item.selected_storage === selectedStorage &&
              item.selected_color === selectedColor;
            console.log('Comparing item:', {
              itemId: item.id,
              selectedStorage: item.selected_storage,
              selectedColor: item.selected_color,
              matches: match
            });
            return match;
          });

          console.log('Existing item index found:', existingItemIndex);

          let updatedCart;
          const price = storagePrice || parseFloat(product.price);
          console.log('Calculated price:', price);

          if (existingItemIndex >= 0) {
            console.log('Updating existing item at index:', existingItemIndex);
            // Update existing item
            updatedCart = [...currentCart];
            updatedCart[existingItemIndex].quantity += quantity;
            updatedCart[existingItemIndex].subtotal = updatedCart[existingItemIndex].quantity * price;
          } else {
            console.log('Adding new item to cart');
            // Add new item
            const cartItemId = `${itemId}_${selectedStorage || 'none'}_${selectedColor || 'none'}_${Date.now()}`;
            const newItem = {
              id: itemId, // Keep original product ID
              cartItemId: cartItemId, // Unique cart item ID
              type: type,
              name: product.product_name,
              price: price,
              quantity: quantity,
              image: product.images_url && product.images_url.length > 0 ? product.images_url[0] : null,
              subtotal: price * quantity,
              selected_storage: selectedStorage,
              storage_price: storagePrice,
              selected_color: selectedColor,
            };
            console.log('New item created:', newItem);
            updatedCart = [...currentCart, newItem];
          }

        //   console.log('Updated cart:', updatedCart);
          get().setCartItems(updatedCart);
          console.log('Cart items set successfully');
          get().showToast('1 item added to cart');

        } catch (error) {
          console.error('Error adding to cart:', error);
          get().showToast('Error adding item to cart', 'error');
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (itemIdentifier, quantity) => {
        if (quantity <= 0) {
          return get().removeFromCart(itemIdentifier);
        }

        set({ isLoading: true });

        try {
          const currentCart = get().cartItems;
          const updatedCart = currentCart.map(item => {
            // Check both cartItemId and id for backward compatibility
            if (item.cartItemId === itemIdentifier || item.id === itemIdentifier) {
              const newQuantity = quantity;
              return {
                ...item,
                quantity: newQuantity,
                subtotal: item.price * newQuantity
              };
            }
            return item;
          });

          get().setCartItems(updatedCart);
        } catch (error) {
          console.error('Error updating cart:', error);
          get().showToast('Error updating cart', 'error');
        } finally {
          set({ isLoading: false });
        }
      },

      removeFromCart: async (itemIdentifier) => {
        set({ isLoading: true });

        try {
          const currentCart = get().cartItems;
          const updatedCart = currentCart.filter(item =>
            item.cartItemId !== itemIdentifier && item.id !== itemIdentifier
          );

          get().setCartItems(updatedCart);
          get().showToast('Item removed from cart');
        } catch (error) {
          console.error('Error removing from cart:', error);
          get().showToast('Error removing item', 'error');
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: async () => {
        set({ isLoading: true });

        try {
          get().setCartItems([]);
          get().showToast('Cart cleared');
        } catch (error) {
          console.error('Error clearing cart:', error);
          get().showToast('Error clearing cart', 'error');
        } finally {
          set({ isLoading: false });
        }
      },

      refreshCart: async () => {
        console.log('RefreshCart called');
        // For local storage, ensure we're using the current persisted state
        // Trigger a re-hydration if needed
        try {
          const store = get();
          console.log('Current cart state in refreshCart:', {
            cartItems: store.cartItems,
            cartCount: store.cartCount,
            cartTotal: store.cartTotal,
            hasHydrated: store._hasHydrated
          });

          // If not hydrated yet, wait a bit and try again
          if (!store._hasHydrated) {
            console.log('Cart not hydrated yet, waiting...');
            setTimeout(() => {
              const updatedStore = get();
              console.log('Retry - cart state after wait:', {
                cartItems: updatedStore.cartItems,
                hasHydrated: updatedStore._hasHydrated
              });
            }, 100);
          }
        } catch (error) {
          console.error('Error in refreshCart:', error);
        }
      },

      // UI Actions
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // Toast functionality
      showToast: (message, type = 'success') => {
        // Create and show toast notification
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white font-medium transition-all duration-300 transform translate-x-full ${
          type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
          toast.classList.remove('translate-x-full');
        }, 10);

        // Animate out and remove
        setTimeout(() => {
          toast.classList.add('translate-x-full');
          setTimeout(() => {
            document.body.removeChild(toast);
          }, 300);
        }, 3000);
      },

      increaseQuantity: (itemId) => {
        const item = get().cartItems.find(item => item.id == itemId);
        if (item) {
          get().updateQuantity(itemId, item.quantity + 1);
        }
      },

      decreaseQuantity: (itemId) => {
        const item = get().cartItems.find(item => item.id == itemId);
        if (item && item.quantity > 1) {
          get().updateQuantity(itemId, item.quantity - 1);
        }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        cartItems: state.cartItems,
        cartTotal: state.cartTotal,
        cartCount: state.cartCount,
      }),
      // Add hydration handling
      onRehydrateStorage: (state) => {
        console.log('Cart hydration starts:', state);
        return (state, error) => {
          if (error) {
            console.log('Cart hydration error:', error);
          } else {
            console.log('Cart hydration finished successfully:', state);
            if (state) {
              state.setHasHydrated(true);
            }
          }
        };
      },
      // Explicitly use localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCartStore;
