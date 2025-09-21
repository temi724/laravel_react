import React, { useState, useEffect } from 'react';
import InvoiceView from './InvoiceView';

const AdminSalesManager = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');

  // Date filter state
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1st of current year
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const [confirmOrderId, setConfirmOrderId] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    loadSales();
  }, [search, statusFilter, paymentFilter, orderTypeFilter, dateFilter, currentPage]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        payment: paymentFilter,
        order_type: orderTypeFilter,
        start_date: dateFilter.startDate,
        end_date: dateFilter.endDate,
        page: currentPage,
      });

      const response = await fetch(`/api/admin/sales?${params}`);
      const data = await response.json();

      setSales(data.sales || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (saleId) => {
    const wasExpanded = expandedRows.includes(saleId);

    setExpandedRows(prev =>
      prev.includes(saleId)
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    );

    // If we're expanding a row, scroll it into view after a brief delay
    if (!wasExpanded) {
      setTimeout(() => {
        const rowElement = document.querySelector(`[data-sale-id="${saleId}"]`);
        if (rowElement) {
          rowElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100); // Small delay to allow the expansion animation to start
    }
  };

  const handleStatusChange = async (saleId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/sales/${saleId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        loadSales(); // Refresh list
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handlePaymentStatusChange = async (saleId, newPaymentStatus) => {
    try {
      const response = await fetch(`/api/admin/sales/${saleId}/payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ payment_status: newPaymentStatus }),
      });

      if (response.ok) {
        loadSales(); // Refresh list
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const confirmAction_func = (action, orderId, message) => {
    setConfirmAction(action);
    setConfirmOrderId(orderId);
    setConfirmMessage(message);
    setShowConfirmModal(true);
  };

  const executeConfirmedAction = async () => {
    if (confirmAction === 'mark_completed') {
      await handleStatusChange(confirmOrderId, 'completed');
    } else if (confirmAction === 'mark_payment_completed') {
      await handlePaymentStatusChange(confirmOrderId, 'completed');
    }

    setShowConfirmModal(false);
    setConfirmAction('');
    setConfirmOrderId('');
    setConfirmMessage('');
  };

  const formatPrice = (price) => `₦${parseFloat(price || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Parse order details JSON
  const parseOrderDetails = (orderDetailsString) => {
    try {
      if (typeof orderDetailsString === 'string') {
        return JSON.parse(orderDetailsString);
      }
      return orderDetailsString || [];
    } catch (error) {
      console.error('Error parsing order details:', error);
      return [];
    }
  };

  // Calculate total from order details
  const calculateOrderTotal = (orderDetails) => {
    const details = parseOrderDetails(orderDetails);
    return details.reduce((total, item) => total + (item.subtotal || 0), 0);
  };

  // Format currency as Nigerian Naira
  const formatNGN = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '₦0.00';
    return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Handle invoice modal
  const openInvoiceModal = (sale) => {
    console.log('Opening invoice modal for sale:', sale);
    setSelectedSale(sale);
    setShowInvoiceModal(true);
  };

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedSale(null);
  };

  const getStatusBadge = (status) => {
    const completed = status;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
        {paymentStatus ? paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1) : 'Unknown'}
      </span>
    );
  };

  const SaleRow = ({ sale, openInvoiceModal, confirmAction_func }) => {
    const isExpanded = expandedRows.includes(sale.id);

    return (
      <>
        <tr
          className="hover:bg-gray-50 cursor-pointer"
          onClick={() => toggleRow(sale.id)}
          data-sale-id={sale.id}
        >
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center space-x-2">
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRow(sale.id);
                }}
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
              <span className="text-blue-600 hover:text-blue-900 font-medium">
                {sale.order_id || sale.id}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {sale.username}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {sale.emailaddress}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {getStatusBadge(sale.order_status)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {getPaymentStatusBadge(sale.payment_status)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {sale.order_type || 'pickup'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {new Date(sale.created_at).toLocaleDateString()}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex items-center justify-end space-x-3">
              {!sale.order_status && (
                <div className="relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmAction_func('mark_completed', sale.id, `Mark order ${sale.order_id} as completed?`);
                    }}
                    className="inline-flex items-center p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Mark as Complete
                  </div>
                </div>
              )}
              {sale.payment_status === 'pending' && (
                <div className="relative group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmAction_func('mark_payment_completed', sale.id, `Mark payment for ${sale.order_id} as completed?`);
                    }}
                    className="inline-flex items-center p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Mark Payment Complete
                  </div>
                </div>
              )}
              <div className="relative group">
                <button
                  onClick={(e) => {
                    console.log('Invoice button clicked for sale:', sale);
                    e.stopPropagation();
                    openInvoiceModal(sale);
                  }}
                  className="inline-flex items-center p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  View Invoice
                </div>
              </div>
            </div>
          </td>
        </tr>

        {isExpanded && (
          <tr>
            <td colSpan="8" className="px-0 py-0">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-l-4 border-indigo-500">
                <div className="px-6 py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customer Details */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <h4 className="font-semibold text-gray-900">Customer Details</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium text-gray-900">{sale.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium text-gray-900">{sale.emailaddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium text-gray-900">{sale.phonenumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium text-gray-900">{sale.location || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">City:</span>
                          <span className="font-medium text-gray-900">{sale.city && sale.state ? `${sale.city}, ${sale.state}` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Information */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <h4 className="font-semibold text-gray-900">Order Information</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order ID:</span>
                          <span className="font-medium text-gray-900">{sale.order_id || sale.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium text-gray-900">{sale.quantity} items</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Type:</span>
                          <span className="font-medium text-gray-900 capitalize">{sale.order_type || 'pickup'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span>{getStatusBadge(sale.order_status)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment:</span>
                          <span>{getPaymentStatusBadge(sale.payment_status)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span className="font-medium text-gray-900">{new Date(sale.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Products Section - Full Width */}
                  <div className="mt-6">

                    {/* Products & Total */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                        <h4 className="font-semibold text-gray-900">Order Items</h4>
                      </div>

                      {(() => {
                        const orderDetails = parseOrderDetails(sale.order_details);
                        if (orderDetails && orderDetails.length > 0) {
                          return (
                            <div className="space-y-3">
                              {orderDetails.map((item, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-gray-900 mb-1">{item.name}</h5>
                                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          ID: {item.id}
                                        </span>
                                        {item.type && (
                                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                            {item.type}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-emerald-600 text-lg">
                                        {formatPrice(item.subtotal)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div>
                                      <span className="text-gray-600">Unit Price:</span>
                                      <div className="font-medium">{formatPrice(item.price)}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Quantity:</span>
                                      <div className="font-medium">{item.quantity}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Subtotal:</span>
                                      <div className="font-bold text-emerald-600">{formatPrice(item.subtotal)}</div>
                                    </div>
                                  </div>

                                  {item.storage_price && item.storage_price !== item.price && (
                                    <div className="mt-2 pt-2 border-t border-gray-300">
                                      <div className="text-xs text-gray-600">
                                        <span>Storage Price: {formatPrice(item.storage_price)}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Order Total */}
                              <div className="mt-4 pt-4 border-t-2 border-gray-300">
                                <div className="flex justify-between items-center bg-emerald-50 rounded-lg p-3">
                                  <span className="text-lg font-semibold text-gray-900">Order Total:</span>
                                  <span className="text-2xl font-bold text-emerald-600">
                                    {formatPrice(calculateOrderTotal(sale.order_details))}
                                  </span>
                                </div>
                                <div className="mt-2 text-xs text-gray-600 text-center">
                                  Total items: {orderDetails.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-center py-4">
                              <div className="text-gray-500 italic">No detailed product information available</div>
                              {sale.product_ids && sale.product_ids.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-gray-600 text-sm">Product IDs: </span>
                                  <div className="mt-1 flex flex-wrap gap-1 justify-center">
                                    {sale.product_ids.map((productId, index) => (
                                      <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                                        #{productId}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Click row to collapse details</span>
                      <div className="flex space-x-3">
                        <a
                          href={`/admin/invoice/${sale.id}`}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          View Invoice
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
            <p className="mt-1 text-sm text-gray-600">Manage orders and customer transactions</p>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders, customers..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Order Type Filter */}
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>

          {/* Date Filters and Refresh */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Date Range:</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-500 self-center">to</span>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={loadSales}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <span>Order ID</span>
                    <span className="text-gray-400 text-xs normal-case">(Click to expand)</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">Loading...</div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">No sales found</div>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <SaleRow
                    key={sale.id}
                    sale={sale}
                    openInvoiceModal={openInvoiceModal}
                    confirmAction_func={confirmAction_func}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedSale && (
        <InvoiceView
          sale={selectedSale}
          onClose={closeInvoiceModal}
        />
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

export default AdminSalesManager;
