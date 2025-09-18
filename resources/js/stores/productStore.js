import { create } from 'zustand';
import axios from 'axios';

const useProductStore = create((set, get) => ({
  // State
  products: [],
  totalProducts: 0,
  currentPage: 1,
  perPage: 12,
  hasMore: true,
  isLoading: false,

  // Filters
  sortBy: 'created_at',
  sortDirection: 'desc',
  selectedCategory: '',
  minPrice: '',
  maxPrice: '',
  productStatus: '',
  searchQuery: '',

  // Search dropdown
  searchResults: [],
  showSearchDropdown: false,

  // Actions
  setFilters: (filters) => {
    set((state) => ({
      ...state,
      ...filters,
      currentPage: 1, // Reset page when filters change
    }));
    get().loadProducts();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query, currentPage: 1 });

    if (query.length >= 2) {
      get().searchProducts();
      set({ showSearchDropdown: true });
    } else {
      set({ searchResults: [], showSearchDropdown: false });
    }

    get().loadProducts();
  },

  setSortBy: (sortBy, direction = 'asc') => {
    set({ sortBy, sortDirection: direction, currentPage: 1 });
    get().loadProducts();
  },

  setPerPage: (perPage) => {
    set({ perPage, currentPage: 1 });
    get().loadProducts();
  },

  setCategory: (categoryId) => {
    set({ selectedCategory: categoryId, currentPage: 1 });
    get().loadProducts();
  },

  loadProducts: async (loadMore = false) => {
    const state = get();

    if (state.isLoading) return;

    set({ isLoading: true });

    try {
      const params = {
        page: loadMore ? state.currentPage + 1 : state.currentPage,
        per_page: state.perPage,
        sort_by: state.sortBy,
        sort_direction: state.sortDirection,
      };

      // Add filters if they exist
      if (state.selectedCategory) params.category_id = state.selectedCategory;
      if (state.minPrice) params.min_price = state.minPrice;
      if (state.maxPrice) params.max_price = state.maxPrice;
      if (state.productStatus) params.status = state.productStatus;
      if (state.searchQuery) params.q = state.searchQuery;

      const response = await axios.get('/api/products', { params });

      console.log('API Response:', response.data);

      // Laravel pagination response structure
      const newProducts = response.data.data;

      set({
        products: loadMore ? [...state.products, ...newProducts] : newProducts,
        totalProducts: response.data.total,
        currentPage: response.data.current_page,
        hasMore: response.data.current_page < response.data.last_page,
      });
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadMore: () => {
    const state = get();
    if (state.hasMore && !state.isLoading) {
      get().loadProducts(true);
    }
  },

  searchProducts: async () => {
    const { searchQuery } = get();

    if (!searchQuery || searchQuery.length < 2) {
      set({ searchResults: [] });
      return;
    }

    try {
      const response = await axios.get('/api/products/search', {
        params: {
          q: searchQuery,
          limit: 5 // Limit search dropdown results
        }
      });

      if (response.data.success) {
        set({ searchResults: response.data.data });
      }
    } catch (error) {
      console.error('Error searching products:', error);
      set({ searchResults: [] });
    }
  },

  hideSearchDropdown: () => {
    set({ showSearchDropdown: false });
  },

  clearFilters: () => {
    set({
      selectedCategory: '',
      minPrice: '',
      maxPrice: '',
      productStatus: '',
      searchQuery: '',
      sortBy: 'created_at',
      sortDirection: 'desc',
      currentPage: 1,
    });
    get().loadProducts();
  },

  // Initialize store
  initialize: (initialData = {}) => {
    set({
      searchQuery: initialData.searchQuery || '',
      selectedCategory: initialData.categoryId || '',
    });
    get().loadProducts();
  },
}));

export default useProductStore;
