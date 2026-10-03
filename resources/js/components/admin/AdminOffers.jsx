import React, { useCallback, useEffect, useState } from 'react';
import { Add, Edit2, Timer1, Trash } from 'iconsax-react';
import BundleDialog from './offers/BundleDialog';
import PromotionDialog from './offers/PromotionDialog';
import ProductImage from '../ProductImage';
import { Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, SectionHeader, Table, TableMessage, TableSkeleton, Tabs, Td, Th } from './ui';
import { api, formatDateTime, formatPrice } from '../../lib/admin';
import { showToast } from '../../lib/toast';

const TABS = [
  { id: 'deal_of_day', label: 'Deal of the day' },
  { id: 'drop', label: 'Drops' },
  { id: 'bundle', label: 'Bundles' },
];

const STATUS = {
  live: { label: 'Live', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'brand' },
  sold_out: { label: 'Sold out', tone: 'warning' },
  ended: { label: 'Ended', tone: 'neutral' },
  off: { label: 'Off', tone: 'neutral' },
};

const INTRO = {
  deal_of_day: {
    title: 'Deal of the day',
    description: 'One product at a special price for a day. It shows near the top of the store with a countdown, and the price goes back by itself when the day ends.',
    action: 'Set a deal',
    empty: ['No deal of the day yet', 'Pick a product, a price and a day.'],
  },
  drop: {
    title: 'Drops',
    description: 'A set number of units at a special price, released at a set time. The product cannot be bought until the drop starts; when the units are gone the usual price returns.',
    action: 'Schedule a drop',
    empty: ['No drops yet', 'Pick a product, a price, how many units and when it starts.'],
  },
  bundle: {
    title: 'Bundles',
    description: 'Products that go together, sold for one price. Stock and serial numbers are still kept per product when a bundle is sold.',
    action: 'New bundle',
    empty: ['No bundles yet', 'Put two or more products together and give the set a price.'],
  },
};

const productCell = (product, extra) => (
  <div className="flex min-w-56 items-center gap-3">
    <ProductImage src={product?.image} className="size-12 rounded-xl" iconSize={18} />
    <div className="min-w-0">
      <p className="max-w-72 truncate font-semibold">{product?.product_name || 'Deleted product'}</p>
      {extra && <p className="max-w-72 truncate text-xs text-gray-500">{extra}</p>}
    </div>
  </div>
);

// Offers: the deal of the day, drops and bundles
const AdminOffers = () => {
  const [tab, setTab] = useState('deal_of_day');
  const [promotions, setPromotions] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [dialog, setDialog] = useState(null); // { kind: 'promotion' | 'bundle', item }
  const [confirm, setConfirm] = useState(null); // { action: 'end' | 'delete', kind, item }
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, data } = await api('/api/admin/offers');
      setPromotions(data?.promotions || []);
      setBundles(data?.bundles || []);
      setLoadFailed(!ok);
    } catch (error) {
      console.error('Error loading offers:', error);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runConfirmed = async () => {
    if (!confirm) return;

    setBusy(true);
    const { action, kind, item } = confirm;
    const base = kind === 'bundle' ? `/api/admin/bundles/${item.id}` : `/api/admin/promotions/${item.id}`;
    try {
      const { ok, data } = await api(action === 'end' ? `${base}/end` : base, { method: action === 'end' ? 'POST' : 'DELETE' });
      if (ok) {
        showToast(action === 'end' ? 'Ended. The usual price is back.' : 'Deleted');
        load();
      } else {
        showToast(data?.message || 'Could not do that. Try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating offer:', error);
      showToast('Could not do that. Try again.', 'error');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const intro = INTRO[tab];
  const rows = tab === 'bundle' ? bundles : promotions.filter((promotion) => promotion.type === tab);
  const columns = tab === 'bundle' ? 4 : tab === 'drop' ? 6 : 5;

  const promotionRow = (promotion) => {
    const status = STATUS[promotion.status] || STATUS.off;
    const editable = promotion.status === 'live' || promotion.status === 'scheduled';

    return (
      <tr key={promotion.id} className="border-b border-gray-100 last:border-0">
        <Td>{productCell(promotion.product, [promotion.storage, promotion.headline].filter(Boolean).join(', '))}</Td>
        <Td className="whitespace-nowrap tabular-nums">
          <span className="font-semibold">{formatPrice(promotion.price)}</span>
          {promotion.usual_price > promotion.price && <s className="ml-2 text-xs text-gray-500">{formatPrice(promotion.usual_price)}</s>}
        </Td>
        <Td className="whitespace-nowrap text-gray-600">
          <p>{formatDateTime(promotion.starts_at)}</p>
          <p className="text-xs text-gray-500">{promotion.ends_at ? `to ${formatDateTime(promotion.ends_at)}` : 'until the units are gone'}</p>
        </Td>
        {tab === 'drop' && (
          <Td className="whitespace-nowrap tabular-nums">
            <span className="font-semibold">{promotion.units_sold}</span> of {promotion.quantity_limit} sold
            {promotion.per_order_limit ? <p className="text-xs text-gray-500">Limit {promotion.per_order_limit} per order</p> : null}
          </Td>
        )}
        <Td>
          <Badge tone={status.tone}>{status.label}</Badge>
          {tab === 'deal_of_day' && promotion.units_sold > 0 && <p className="mt-1 text-xs text-gray-500 tabular-nums">{promotion.units_sold} sold</p>}
        </Td>
        <Td align="right">
          <div className="flex items-center justify-end gap-1">
            {promotion.status === 'live' && (
              <Button variant="secondary" size="sm" icon={Timer1} onClick={() => setConfirm({ action: 'end', kind: 'promotion', item: promotion })}>
                End now
              </Button>
            )}
            {editable && <IconButton icon={Edit2} label="Edit" onClick={() => setDialog({ kind: 'promotion', item: promotion })} />}
            <IconButton icon={Trash} tone="danger" label="Delete" onClick={() => setConfirm({ action: 'delete', kind: 'promotion', item: promotion })} />
          </div>
        </Td>
      </tr>
    );
  };

  const bundleRow = (bundle) => (
    <tr key={bundle.id} className="border-b border-gray-100 last:border-0">
      <Td>
        <div className="flex min-w-64 items-center gap-3">
          <div className="flex shrink-0 -space-x-3">
            {bundle.items.slice(0, 3).map((item, index) => (
              <ProductImage key={`${item.product_id}-${index}`} src={item.product?.image} className="size-11 rounded-xl border-2 border-white" iconSize={16} />
            ))}
          </div>
          <div className="min-w-0">
            <p className="max-w-72 truncate font-semibold">{bundle.name}</p>
            <p className="max-w-80 truncate text-xs text-gray-500">
              {bundle.items.map((item) => `${item.quantity > 1 ? `${item.quantity} x ` : ''}${item.product?.product_name || 'Deleted product'}${item.storage ? ` (${item.storage})` : ''}`).join(', ')}
            </p>
          </div>
        </div>
      </Td>
      <Td className="whitespace-nowrap tabular-nums">
        <span className="font-semibold">{formatPrice(bundle.price)}</span>
        <p className="text-xs text-gray-500">
          <s>{formatPrice(bundle.usual_price)}</s> <span className="font-semibold text-sale">saves {formatPrice(bundle.saving)}</span>
        </p>
      </Td>
      <Td>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={bundle.is_active ? 'success' : 'neutral'}>{bundle.is_active ? 'On sale' : 'Off'}</Badge>
          {bundle.is_active && !bundle.in_stock && <Badge tone="danger">An item is out of stock</Badge>}
        </div>
      </Td>
      <Td align="right">
        <div className="flex items-center justify-end gap-1">
          <IconButton icon={Edit2} label={`Edit ${bundle.name}`} onClick={() => setDialog({ kind: 'bundle', item: bundle })} />
          <IconButton icon={Trash} tone="danger" label={`Delete ${bundle.name}`} onClick={() => setConfirm({ action: 'delete', kind: 'bundle', item: bundle })} />
        </div>
      </Td>
    </tr>
  );

  return (
    <div className="space-y-4">
      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Kinds of offer" />

      <Card>
        <SectionHeader
          title={intro.title}
          description={intro.description}
          actions={
            <Button icon={Add} onClick={() => setDialog({ kind: tab === 'bundle' ? 'bundle' : 'promotion', item: null })}>
              {intro.action}
            </Button>
          }
        />
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>{tab === 'bundle' ? 'Bundle' : 'Product'}</Th>
            <Th>{tab === 'bundle' ? 'Price' : tab === 'drop' ? 'Drop price' : 'Deal price'}</Th>
            {tab !== 'bundle' && <Th>{tab === 'drop' ? 'Starts' : 'Runs'}</Th>}
            {tab === 'drop' && <Th>Units</Th>}
            <Th>Status</Th>
            <Th align="right">
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton columns={columns} rows={3} />
          ) : loadFailed ? (
            <TableMessage columns={columns}>
              <EmptyState title="We could not load the offers" description="Check your connection and try again." action={<Button onClick={load}>Try again</Button>} />
            </TableMessage>
          ) : rows.length === 0 ? (
            <TableMessage columns={columns}>
              <EmptyState title={intro.empty[0]} description={intro.empty[1]} />
            </TableMessage>
          ) : tab === 'bundle' ? (
            rows.map(bundleRow)
          ) : (
            rows.map(promotionRow)
          )}
        </tbody>
      </Table>

      {dialog?.kind === 'promotion' && (
        <PromotionDialog
          type={tab}
          promotion={dialog.item}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            load();
          }}
        />
      )}

      {dialog?.kind === 'bundle' && (
        <BundleDialog
          bundle={dialog.item}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            load();
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.action === 'end' ? 'End this offer now?' : `Delete this ${confirm.kind === 'bundle' ? 'bundle' : 'offer'}?`}
          message={
            confirm.action === 'end'
              ? 'The special price stops at once and the usual price returns. Orders already placed keep the price they were placed at.'
              : confirm.kind === 'bundle'
                ? `"${confirm.item.name}" will be removed from the store. Orders already placed are not affected.`
                : 'It will be removed. Orders already placed keep the price they were placed at.'
          }
          confirmLabel={confirm.action === 'end' ? 'End now' : 'Delete'}
          tone={confirm.action === 'end' ? 'primary' : 'danger'}
          loading={busy}
          onConfirm={runConfirmed}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

export default AdminOffers;
