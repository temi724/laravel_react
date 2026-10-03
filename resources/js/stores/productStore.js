import { create } from 'zustand';
import axios from 'axios';

const useProductStore = create((set, get) => ({
  // State
  products: [],
  totalProducts: 0,
  currentPage: 1,
  // 30 fills whole rows at 2, 3, 5 and 6 columns
  perPage: 30,
  hasMore: true,
  isLoading: false,
  loadError: false,
  // True while the products shown are the ones the page was served with
  seeded: false,

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

    set({ isLoading: true, loadError: false });

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

      // Use search endpoint if there's a search query
      let endpoint = '/api/products';
      if (state.searchQuery) {
        params.q = state.searchQuery;
        endpoint = '/api/products/search';
      }

      console.log('ProductStore Debug:', {
        searchQuery: state.searchQuery,
        endpoint: endpoint,
        params: params
      });

      const response = await axios.get(endpoint, { params });

      console.log('API Response:', response.data);

      // Laravel pagination response structure
      const newProducts = response.data.data;

      set({
        seeded: false,
        products: loadMore ? [...state.products, ...newProducts] : newProducts,
        totalProducts: response.data.total,
        currentPage: response.data.current_page,
        hasMore: response.data.current_page < response.data.last_page,
      });
    } catch (error) {
      console.error('Error loading products:', error);
      set({ loadError: true });
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
          per_page: 5 // Limit search dropdown results
        }
      });

      set({ searchResults: response.data.data });
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

  // Start from the page of products the server printed in the HTML, instead of asking for it
  // again. `seeded` stays true until the grid loads something itself.
  seed: (listing, { categoryId = '' } = {}) => {
    set({
      products: listing.data,
      totalProducts: listing.total,
      currentPage: Number(listing.current_page) || 1,
      perPage: Number(listing.per_page) || get().perPage,
      hasMore: Number(listing.current_page) < Number(listing.last_page),
      selectedCategory: categoryId,
      searchQuery: '',
      seeded: true,
    });
  },

  // Initialize store
  initialize: (initialData = {}) => {
    set({
      searchQuery: initialData.searchQuery || '',
      selectedCategory: initialData.categoryId || '',
    });
    // A seeded grid already has its first page
    if (!initialData.seeded) get().loadProducts();
  },
}));

export default useProductStore;
