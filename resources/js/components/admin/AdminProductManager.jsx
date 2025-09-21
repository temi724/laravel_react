import React, { useState, useEffect } from 'react';
import AdminProductCreate from './AdminProductCreate.jsx';
import AdminProductEdit from './AdminProductEdit.jsx';

const AdminProductManager = () => {
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadItems();
  }, [search, typeFilter, statusFilter, currentPage]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        type: typeFilter,
        status: statusFilter,
        page: currentPage,
        per_page: perPage,
      });

      const response = await fetch(`/api/admin/products?${params}`);
      const data = await response.json();

      if (data.products) setProducts(data.products);
      if (data.deals) setDeals(data.deals);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item, type) => {
    setEditingItem({ ...item, type });
    setShowEditForm(true);
  };

  const handleDelete = async (id, type) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/admin/${type}s/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'Item deleted successfully');
        loadItems(); // Refresh list
      } else {
        const error = await response.json();
        alert(error.message || 'Error deleting item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const formatPrice = (price) => `₦${parseFloat(price).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const ItemRow = ({ item, type }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 w-80">
        <div className="flex items-center">
          <div className="h-12 w-12 flex-shrink-0">
            {item.images_url && item.images_url.length > 0 ? (
              <img
                className="h-12 w-12 rounded object-cover"
                src={item.images_url[0]}
                alt={item.product_name}
              />
            ) : (
              <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-4 min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">{item.product_name}</div>
            <div className="text-sm text-gray-500 truncate">
              {type === 'product' ? 'Product' : 'Deal'} • {item.category?.name || 'No Category'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{formatPrice(item.price)}</span>
            {type === 'deal' && item.old_price && item.old_price > item.price && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                -{Math.round(((item.old_price - item.price) / item.old_price) * 100)}%
              </span>
            )}
          </div>
          {type === 'deal' && item.old_price && item.old_price > item.price && (
            <span className="text-xs text-gray-500 line-through">
              {formatPrice(item.old_price)}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 w-32">
        <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm whitespace-nowrap ${
          item.in_stock
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${
            item.in_stock ? 'bg-emerald-500' : 'bg-red-500'
          }`}></span>
          {item.in_stock ? 'In Stock' : 'Out of Stock'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {new Date(item.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={() => handleEdit(item, type)}
            className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
            title="Edit Product"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button
            onClick={() => handleDelete(item.id, type)}
            className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 group"
            title="Delete Product"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );

  const allItems = [
    ...products.map(p => ({ ...p, type: 'product' })),
    ...deals.map(d => ({ ...d, type: 'deal' }))
  ].filter(item => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (search && !item.product_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Show create form if requested
  if (showCreateForm) {
    return (
      <AdminProductCreate
        onCancel={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false);
          loadItems(); // Reload the products list
        }}
      />
    );
  }

  // Show edit form if requested
  if (showEditForm && editingItem) {
    return (
      <AdminProductEdit
        item={editingItem}
        onCancel={() => {
          setShowEditForm(false);
          setEditingItem(null);
        }}
        onSuccess={() => {
          setShowEditForm(false);
          setEditingItem(null);
          loadItems(); // Reload the products list
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your products and deals inventory</p>
          </div>
        </div>
      </div>

      {/* Header with Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products and deals..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="product">Products</option>
              <option value="deal">Deals</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="text-gray-500">Loading...</div>
                  </td>
                </tr>
              ) : allItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="text-gray-500">No items found</div>
                  </td>
                </tr>
              ) : (
                allItems.map((item) => (
                  <ItemRow key={`${item.type}-${item.id}`} item={item} type={item.type} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProductManager;
