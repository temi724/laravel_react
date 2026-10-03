import React, { useEffect, useState } from 'react';
import { ArrowLeft, DocumentText, Printer, ReceiptSearch, SearchNormal1, TickCircle, WalletCheck } from 'iconsax-react';
import { Alert, Button, Card, ConfirmDialog, DetailList, EmptyState, Field, Input, OrderStatusBadge, PaymentStatusBadge, SectionHeader, Skeleton } from './ui';
import { api, can, formatDateTime, formatPrice, lineNote, parseOrderDetails, saleTotal, serialText } from '../../lib/admin';
import { showToast } from '../../lib/toast';

const CONFIRMATIONS = {
  mark_completed: {
    title: 'Mark this order as completed?',
    message: 'The order will be recorded as delivered or picked up.',
    confirmLabel: 'Mark completed',
    success: 'Order marked as completed',
  },
  mark_payment_completed: {
    title: 'Mark payment as received?',
    message: 'The payment for this order will be recorded as received.',
    confirmLabel: 'Mark received',
    success: 'Payment marked as received',
  },
  mark_payment_failed: {
    title: 'Mark payment as failed?',
    message: 'The payment for this order will be recorded as failed.',
    confirmLabel: 'Mark failed',
    tone: 'danger',
    success: 'Payment marked as failed',
  },
};

const AdminOrderManager = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [confirmAction, setConfirmAction] = useState('');
  const [confirmBusy, setConfirmBusy] = useState(false);

  const loadOrder = async (id) => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      const { ok, data } = await api(`/api/admin/sales/${encodeURIComponent(id)}`);

      if (ok && data?.success) {
        setOrder(data.order);
      } else {
        setOrder(null);
        setError(`We could not find an order with the ID "${id}". Check it and try again.`);
      }
    } catch (err) {
      console.error('Error loading order:', err);
      setError('We could not load the order. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get order ID from URL params
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

  const handleOrderSearch = (e) => {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) return;

    loadOrder(id);
    // Update URL without reloading page
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('order', id);
    window.history.pushState({}, '', newUrl);
  };

  const executeConfirmedAction = async () => {
    if (!order || !confirmAction) return;
    setConfirmBusy(true);

    const request =
      confirmAction === 'mark_completed'
        ? api(`/api/admin/sales/${order.id}/status`, { method: 'PUT', body: { status: 'completed' } })
        : api(`/api/admin/sales/${order.id}/payment-status`, {
            method: 'PUT',
            body: { payment_status: confirmAction === 'mark_payment_failed' ? 'failed' : 'completed' },
          });

    try {
      const { ok, data } = await request;
      if (ok) {
        showToast(CONFIRMATIONS[confirmAction].success);
        await loadOrder(order.id);
      } else {
        setError(data?.message || 'We could not update the order.');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      setError('We could not update the order. Check your connection and try again.');
    } finally {
      setConfirmBusy(false);
      setConfirmAction('');
    }
  };

  const items = order ? parseOrderDetails(order.order_details) : [];
  const orderLabel = order ? order.order_id || order.receipt_number || order.id : '';
  const confirmation = CONFIRMATIONS[confirmAction];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <a href="/admin/sales" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-ink">
        <ArrowLeft size={16} color="currentColor" variant="Linear" />
        Back to sales
      </a>

      {/* Search */}
      <Card>
        <form onSubmit={handleOrderSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Order ID" hint="Paste the ID the customer sent, for example ORD-20261001-123456ABCD." className="flex-1">
            <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ORD-..." autoComplete="off" />
          </Field>
          <Button type="submit" size="lg" icon={SearchNormal1} loading={loading && Boolean(orderId)} className="sm:mb-6">
            Find order
          </Button>
        </form>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Loading */}
      {loading && (
        <Card aria-busy="true" aria-label="Loading order">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-3 h-4 w-40" />
          <Skeleton className="mt-6 h-28 w-full rounded-2xl" />
        </Card>
      )}

      {/* Order details */}
      {!loading && order && (
        <>
          <Card>
            <SectionHeader
              title={`Order ${orderLabel}`}
              description={`Placed ${formatDateTime(order.created_at)}`}
              actions={
                <>
                  <OrderStatusBadge completed={Boolean(order.order_status)} />
                  <PaymentStatusBadge status={order.payment_status} />
                </>
              }
            />

            <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-5">
              {can('sales.approve') && !order.order_status && (
                <Button icon={TickCircle} onClick={() => setConfirmAction('mark_completed')}>
                  Mark as completed
                </Button>
              )}
              {can('sales.approve') && order.payment_status === 'pending' && (
                <>
                  <Button variant={order.order_status ? 'primary' : 'secondary'} icon={WalletCheck} onClick={() => setConfirmAction('mark_payment_completed')}>
                    Mark payment received
                  </Button>
                  <Button variant="secondary" onClick={() => setConfirmAction('mark_payment_failed')}>
                    Mark payment failed
                  </Button>
                </>
              )}
              <Button variant="secondary" icon={DocumentText} href={`/admin/invoice/${order.id}`}>
                Invoice
              </Button>
              <Button variant="ghost" icon={Printer} onClick={() => window.print()}>
                Print
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <SectionHeader as="h3" title="Customer" />
              <DetailList
                className="mt-4"
                items={[
                  { label: 'Name', value: order.username },
                  { label: 'Email', value: order.emailaddress },
                  { label: 'Phone', value: order.phonenumber },
                  { label: 'Address', value: order.location },
                  { label: 'City', value: order.city },
                  { label: 'State', value: order.state },
                ]}
              />
            </Card>

            <Card>
              <SectionHeader as="h3" title="Order" />
              <DetailList
                className="mt-4"
                items={[
                  { label: 'Order ID', value: orderLabel },
                  { label: 'Items', value: order.quantity },
                  { label: 'Type', value: <span className="capitalize">{order.order_type || 'pickup'}</span> },
                  { label: 'Payment method', value: order.payment_method ? <span className="capitalize">{String(order.payment_method).replace(/_/g, ' ')}</span> : null },
                  { label: 'Completed', value: order.completed_at ? formatDateTime(order.completed_at) : null },
                  { label: 'Approved by', value: order.approved_by_admin },
                  { label: 'Payment approved', value: order.payment_approved_at ? formatDateTime(order.payment_approved_at) : null },
                  { label: 'Last updated', value: order.updated_at ? formatDateTime(order.updated_at) : null },
                ]}
              />
            </Card>
          </div>

          <Card>
            <SectionHeader
              as="h3"
              title="Items"
              description={items.length > 0 ? 'Serial numbers come from the products. They are added here when payment is received or the order is completed.' : undefined}
            />
            {items.length > 0 ? (
              <>
                <ul className="mt-4 divide-y divide-gray-100 text-sm">
                  {items.map((item, index) => (
                    <li key={index} className="flex items-start justify-between gap-4 py-3 first:pt-0">
                      <div className="min-w-0">
                        <p className="font-semibold">{item.name}</p>
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
                <div className="flex items-baseline justify-between border-t border-gray-200 pt-4">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-extrabold tracking-tight tabular-nums">{formatPrice(saleTotal(order))}</span>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-gray-600">
                This order has no item details.
                {order.product_ids && order.product_ids.length > 0 ? ` Product IDs: ${order.product_ids.join(', ')}.` : ''}
              </p>
            )}
          </Card>

          {/* Order notes */}
          {order.notes && (
            <Card>
              <SectionHeader as="h3" title="Notes" />
              <p className="mt-3 text-sm whitespace-pre-line text-gray-700">{order.notes}</p>
            </Card>
          )}
        </>
      )}

      {/* No order yet */}
      {!loading && !order && !error && (
        <Card>
          <EmptyState className="py-8" icon={ReceiptSearch} title="Look up an order" description="Enter an order ID above to see its items, customer and payment status." />
        </Card>
      )}

      {/* Confirmation */}
      {confirmation && (
        <ConfirmDialog
          title={confirmation.title}
          message={confirmation.message}
          confirmLabel={confirmation.confirmLabel}
          tone={confirmation.tone}
          loading={confirmBusy}
          onConfirm={executeConfirmedAction}
          onCancel={() => setConfirmAction('')}
        />
      )}
    </div>
  );
};

export default AdminOrderManager;
