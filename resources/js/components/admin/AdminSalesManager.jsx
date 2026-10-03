import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight2, DocumentText, ReceiptItem, Refresh, TickCircle, WalletCheck } from 'iconsax-react';
import InvoiceView from './InvoiceView';
import {
  Badge,
  Button,
  ConfirmDialog,
  DateRange,
  DetailList,
  EmptyState,
  IconButton,
  OrderStatusBadge,
  Pagination,
  PaymentStatusBadge,
  SearchInput,
  Select,
  Table,
  TableMessage,
  TableSkeleton,
  Td,
  Th,
} from './ui';
import { api, can, formatDate, formatDateTime, formatPrice, lineNote, parseOrderDetails, saleTotal, serialText, startOfYear, today } from '../../lib/admin';
import { showToast } from '../../lib/toast';

const COLUMNS = 8;

const AdminSalesManager = () => {
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');

  // Date filter state
  const [dateFilter, setDateFilter] = useState({
    startDate: startOfYear(),
    endDate: today(),
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [confirm, setConfirm] = useState(null); // { action, sale }
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSale, setSelectedSale] = useState(null);

  // Search once typing pauses
  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: appliedSearch,
        status: statusFilter,
        payment: paymentFilter,
        order_type: orderTypeFilter,
        start_date: dateFilter.startDate,
        end_date: dateFilter.endDate,
        page: currentPage,
      });

      const { ok, data } = await api(`/api/admin/sales?${params}`);

      setSales(data?.sales || []);
      setTotalPages(data?.totalPages || 1);
      setTotal(data?.total || 0);
      setLoadFailed(!ok || data?.success === false);
    } catch (error) {
      console.error('Error loading sales:', error);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, statusFilter, paymentFilter, orderTypeFilter, dateFilter, currentPage]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // A new filter starts again from the first page
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch, statusFilter, paymentFilter, orderTypeFilter, dateFilter]);

  const toggleRow = (saleId) => {
    setExpandedRows((prev) => (prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]));
  };

  const executeConfirmedAction = async () => {
    if (!confirm) return;
    setConfirmBusy(true);

    const { action, sale } = confirm;
    const request =
      action === 'mark_completed'
        ? api(`/api/admin/sales/${sale.id}/status`, { method: 'PUT', body: { status: 'completed' } })
        : api(`/api/admin/sales/${sale.id}/payment-status`, { method: 'PUT', body: { payment_status: 'completed' } });

    try {
      const { ok, data } = await request;
      if (ok) {
        showToast(action === 'mark_completed' ? 'Order marked as completed' : 'Payment marked as received');
        loadSales(); // Refresh list
      } else {
        showToast(data?.message || 'Could not update the order', 'error');
      }
    } catch (error) {
      console.error('Error updating sale:', error);
      showToast('Could not update the order', 'error');
    } finally {
      setConfirmBusy(false);
      setConfirm(null);
    }
  };

  // Approving payments and completing orders is a permission of its own
  const canApprove = can('sales.approve');
  const hasFilters = Boolean(appliedSearch) || statusFilter !== 'all' || paymentFilter !== 'all' || orderTypeFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search order, customer, phone" label="Search sales" className="w-full sm:w-72" />
        <Select size="sm" aria-label="Order status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="all">Any status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </Select>
        <Select size="sm" aria-label="Payment status" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="w-44">
          <option value="all">Any payment</option>
          <option value="pending">Payment pending</option>
          <option value="completed">Payment received</option>
          <option value="failed">Payment failed</option>
          <option value="refunded">Refunded</option>
        </Select>
        <Select size="sm" aria-label="Pickup or delivery" value={orderTypeFilter} onChange={(e) => setOrderTypeFilter(e.target.value)} className="w-48">
          <option value="all">Pickup or delivery</option>
          <option value="pickup">Pickup</option>
          <option value="delivery">Delivery</option>
        </Select>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <DateRange value={dateFilter} onChange={setDateFilter} />
          <Button variant="secondary" size="sm" icon={Refresh} loading={loading} onClick={loadSales}>
            Refresh
          </Button>
        </div>
      </div>

      {!loading && !loadFailed && (
        <p className="text-sm text-gray-600" aria-live="polite">
          <span className="font-semibold text-ink tabular-nums">{total.toLocaleString('en-NG')}</span> {total === 1 ? 'sale' : 'sales'}
        </p>
      )}

      {/* Sales table */}
      <Table>
        <thead>
          <tr>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th align="right">Total</Th>
            <Th>Status</Th>
            <Th>Payment</Th>
            <Th>Approved by</Th>
            <Th>Type</Th>
            <Th align="right">
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {loading && sales.length === 0 ? (
            <TableSkeleton columns={COLUMNS} />
          ) : loadFailed ? (
            <TableMessage columns={COLUMNS}>
              <EmptyState title="We could not load the sales" description="Check your connection and try again." action={<Button onClick={loadSales}>Try again</Button>} />
            </TableMessage>
          ) : sales.length === 0 ? (
            <TableMessage columns={COLUMNS}>
              <EmptyState
                icon={ReceiptItem}
                title={hasFilters ? 'No sales match' : 'No sales in these dates'}
                description={hasFilters ? 'Try a different search or remove a filter.' : 'Orders from the store and sales you record in store will appear here.'}
              />
            </TableMessage>
          ) : (
            sales.map((sale) => {
              const isExpanded = expandedRows.includes(sale.id);
              const items = parseOrderDetails(sale.order_details);
              const orderLabel = sale.order_id || sale.receipt_number || sale.id;

              return (
                <React.Fragment key={sale.id}>
                  <tr className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 ${isExpanded ? 'bg-gray-50' : ''}`} onClick={() => toggleRow(sale.id)}>
                    <Td>
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Hide' : 'Show'} details for order ${orderLabel}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(sale.id);
                        }}
                        className="flex items-center gap-2 font-semibold whitespace-nowrap"
                      >
                        <ArrowRight2 size={14} color="currentColor" variant="Linear" className={`shrink-0 text-gray-500 transition-transform duration-200 ease-out ${isExpanded ? 'rotate-90' : ''}`} />
                        {orderLabel}
                      </button>
                      {/* The date sits under the order number, which leaves room for who approved it */}
                      <p className="mt-0.5 pl-[22px] text-xs whitespace-nowrap text-gray-500">{formatDate(sale.created_at)}</p>
                    </Td>
                    <Td>
                      <p className="max-w-48 truncate font-medium">{sale.username}</p>
                      <p className="max-w-48 truncate text-xs text-gray-500">{sale.emailaddress}</p>
                    </Td>
                    <Td align="right" className="font-semibold whitespace-nowrap tabular-nums">
                      {formatPrice(saleTotal(sale))}
                    </Td>
                    <Td>
                      <OrderStatusBadge completed={Boolean(sale.order_status)} />
                    </Td>
                    <Td>
                      <PaymentStatusBadge status={sale.payment_status} />
                    </Td>
                    <Td className="whitespace-nowrap">
                      {sale.approved_by_admin ? (
                        <span className="font-medium">{sale.approved_by_admin}</span>
                      ) : (
                        // Orders approved before the name was being saved have none to show
                        <span className="text-gray-400">{sale.payment_status === 'completed' || sale.order_status ? 'Not recorded' : 'Not yet'}</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-gray-600 capitalize">
                      {sale.order_type || 'pickup'}
                      {sale.sale_type === 'offline' && <Badge className="ml-2">In store</Badge>}
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {canApprove && !sale.order_status && <IconButton icon={TickCircle} tone="success" label="Mark as completed" onClick={() => setConfirm({ action: 'mark_completed', sale })} />}
                        {canApprove && sale.payment_status === 'pending' && (
                          <IconButton icon={WalletCheck} tone="brand" label="Mark payment as received" onClick={() => setConfirm({ action: 'mark_payment_completed', sale })} />
                        )}
                        <IconButton icon={DocumentText} label="View invoice" onClick={() => setSelectedSale(sale)} />
                      </div>
                    </Td>
                  </tr>

                  {isExpanded && (
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <td colSpan={COLUMNS} className="px-5 pt-1 pb-6">
                        <div className="grid animate-fade grid-cols-1 gap-4 lg:grid-cols-3">
                          <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <h3 className="text-sm font-bold">Customer</h3>
                            <DetailList
                              className="mt-3"
                              items={[
                                { label: 'Name', value: sale.username },
                                { label: 'Email', value: sale.emailaddress },
                                { label: 'Phone', value: sale.phonenumber },
                                { label: 'Address', value: sale.location },
                                { label: 'City', value: [sale.city, sale.state].filter(Boolean).join(', ') },
                              ]}
                            />
                          </div>

                          <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <h3 className="text-sm font-bold">Order</h3>
                            <DetailList
                              className="mt-3"
                              items={[
                                { label: 'Order ID', value: orderLabel },
                                { label: 'Items', value: sale.quantity },
                                { label: 'Type', value: <span className="capitalize">{sale.order_type || 'pickup'}</span> },
                                { label: 'Placed', value: formatDateTime(sale.created_at) },
                                { label: 'Approved by', value: sale.approved_by_admin },
                              ]}
                            />
                          </div>

                          <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <h3 className="text-sm font-bold">Items</h3>
                            {items.length > 0 ? (
                              <>
                                <ul className="mt-3 space-y-3 text-sm">
                                  {items.map((item, index) => (
                                    <li key={index} className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-xs text-gray-500 tabular-nums">
                                          {item.quantity} x {formatPrice(item.price)}
                                          {lineNote(item) ? `, ${lineNote(item)}` : ''}
                                        </p>
                                        {serialText(item) && <p className="text-xs font-semibold break-all">S/N {serialText(item)}</p>}
                                      </div>
                                      <p className="shrink-0 font-semibold tabular-nums">{formatPrice(item.subtotal)}</p>
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-3 flex items-baseline justify-between border-t border-gray-200 pt-3">
                                  <span className="text-sm font-bold">Total</span>
                                  <span className="text-lg font-extrabold tracking-tight tabular-nums">{formatPrice(saleTotal(sale))}</span>
                                </div>
                              </>
                            ) : (
                              <p className="mt-3 text-sm text-gray-600">This sale has no item details.</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          <Button variant="secondary" size="sm" icon={DocumentText} onClick={() => setSelectedSale(sale)}>
                            View invoice
                          </Button>
                          <Button variant="secondary" size="sm" href={`/admin/orders?order=${encodeURIComponent(sale.id)}`}>
                            Open order
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </Table>

      <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />

      {/* Invoice */}
      {selectedSale && <InvoiceView sale={selectedSale} onClose={() => setSelectedSale(null)} />}

      {/* Confirmation */}
      {confirm && (
        <ConfirmDialog
          title={confirm.action === 'mark_completed' ? 'Mark this order as completed?' : 'Mark payment as received?'}
          message={
            confirm.action === 'mark_completed'
              ? `Order ${confirm.sale.order_id || confirm.sale.id} will be recorded as delivered or picked up.`
              : `The payment for order ${confirm.sale.order_id || confirm.sale.id} will be recorded as received.`
          }
          confirmLabel={confirm.action === 'mark_completed' ? 'Mark completed' : 'Mark received'}
          loading={confirmBusy}
          onConfirm={executeConfirmedAction}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

export default AdminSalesManager;
