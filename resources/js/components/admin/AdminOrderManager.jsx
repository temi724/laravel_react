import React, { useState, useEffect } from 'react';

const AdminOrderManager = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Get order ID from URL params or props
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderParam = urlParams.get('order') || urlParams.get('id');
    if (orderParam) {
      setOrderId(orderParam);
      loadOrder(orderParam);
    } else {
      setLoading(false);
    }
  }, []);

  const loadOrder = async (id) => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/admin/sales/${id}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || 'Order not found');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSearch = (e) => {
    e.preventDefault();
    if (orderId.trim()) {
      loadOrder(orderId.trim());
      // Update URL without reloading page
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('order', orderId.trim());
      window.history.pushState({}, '', newUrl);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!order) return;

    try {
      const response = await fetch(`/api/admin/sales/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrder(prev => ({ ...prev, order_status: newStatus }));
        setShowConfirmModal(false);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update order status');
    }
  };

  const handlePaymentStatusChange = async (newPaymentStatus) => {
    if (!order) return;

    try {
      const response = await fetch(`/api/admin/sales/${order.id}/payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ payment_status: newPaymentStatus }),
      });

      if (response.ok) {
        setOrder(prev => ({ ...prev, payment_status: newPaymentStatus }));
        setShowConfirmModal(false);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError('Failed to update payment status');
    }
  };

  const confirmAction_func = (action, message) => {
    setConfirmAction(action);
    setConfirmMessage(message);
    setShowConfirmModal(true);
  };

  const executeConfirmedAction = () => {
    if (confirmAction === 'mark_completed') {
      handleStatusChange('completed');
    } else if (confirmAction === 'mark_payment_completed') {
      handlePaymentStatusChange('completed');
    } else if (confirmAction === 'mark_payment_failed') {
      handlePaymentStatusChange('failed');
    }
  };

  const formatPrice = (price) => `₦${parseFloat(price || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusBadge = (status) => {
    const completed = status;
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
        completed
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {completed ? 'Completed' : 'Pending'}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${colors[paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
        {paymentStatus ? paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1) : 'Unknown'}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="mt-1 text-sm text-gray-600">View and manage individual order details</p>
          </div>
          <a
            href="/admin/sales"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Sales
          </a>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleOrderSearch} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
              Search by Order ID
            </label>
            <input
              type="text"
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter order ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-gray-500">Loading order details...</div>
        </div>
      )}

      {/* Order Details */}
      {!loading && order && (
        <>
          {/* Order Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Order #{order.order_id || order.id}
                </h2>
                <p className="text-sm text-gray-600">
                  Created on {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {getStatusBadge(order.order_status)}
                {getPaymentStatusBadge(order.payment_status)}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Contact Details</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Name:</span> {order.username}</p>
                  <p><span className="font-medium">Email:</span> {order.emailaddress}</p>
                  <p><span className="font-medium">Phone:</span> {order.phonenumber}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Address</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Location:</span> {order.location}</p>
                  <p><span className="font-medium">City:</span> {order.city}</p>
                  <p><span className="font-medium">State:</span> {order.state}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Order Information</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Order ID:</span> {order.order_id || order.id}</p>
                  <p><span className="font-medium">Quantity:</span> {order.quantity} items</p>
                  <p><span className="font-medium">Order Type:</span> {order.order_type || 'pickup'}</p>
                  <p><span className="font-medium">Total Amount:</span> {formatPrice(order.total_amount)}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Status Information</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Order Status:</span> {order.order_status ? 'Completed' : 'Pending'}</p>
                  <p><span className="font-medium">Payment Status:</span> {order.payment_status || 'pending'}</p>
                  <p><span className="font-medium">Created:</span> {new Date(order.created_at).toLocaleDateString()}</p>
                  {order.updated_at && (
                    <p><span className="font-medium">Last Updated:</span> {new Date(order.updated_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Information */}
          {order.product_ids && order.product_ids.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Products</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Product IDs:</span> {order.product_ids.join(', ')}
                </p>
                <p className="text-sm text-gray-500">
                  Note: Detailed product information requires integration with product lookup
                </p>
              </div>
            </div>
          )}

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Notes</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="flex flex-wrap gap-3">
              {!order.order_status && (
                <button
                  onClick={() => confirmAction_func('mark_completed', `Mark order ${order.order_id || order.id} as completed?`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Mark as Completed
                </button>
              )}

              {order.payment_status === 'pending' && (
                <>
                  <button
                    onClick={() => confirmAction_func('mark_payment_completed', `Mark payment for order ${order.order_id || order.id} as completed?`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Mark Payment Complete
                  </button>
                  <button
                    onClick={() => confirmAction_func('mark_payment_failed', `Mark payment for order ${order.order_id || order.id} as failed?`)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Mark Payment Failed
                  </button>
                </>
              )}

              <a
                href={`/admin/invoice/${order.id}`}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Generate Invoice
              </a>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Print Order
              </button>
            </div>
          </div>
        </>
      )}

      {/* No Order State */}
      {!loading && !order && !error && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Enter an order ID to view details</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Action</h3>
              <p className="text-gray-600 mb-6">{confirmMessage}</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderManager;
