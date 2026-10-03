import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Add, Box, Edit2, ExportSquare, ImportSquare, Trash } from 'iconsax-react';
import AdminProductCreate from './AdminProductCreate.jsx';
import AdminProductEdit from './AdminProductEdit.jsx';
import ProductExportDialog from './ProductExportDialog.jsx';
import ProductImportDialog from './ProductImportDialog.jsx';
import ProductImage from '../ProductImage';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Pagination,
  SearchInput,
  Select,
  StockBadge,
  Table,
  TableMessage,
  TableSkeleton,
  Tabs,
  Td,
  Th,
} from './ui';
import { api, can, formatDate, formatPrice } from '../../lib/admin';
import { conditionLabel, discountPercent } from '../../lib/format';
import { showToast } from '../../lib/toast';

const PER_PAGE = 20;

const TYPE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'product', label: 'Products' },
  { id: 'deal', label: 'Deals' },
];

const SERIALS_SHOWN = 2;

// The serial numbers of the units in stock. Long lists open in place.
const SerialList = ({ serials }) => {
  const [open, setOpen] = useState(false);
  const list = Array.isArray(serials) ? serials : [];

  if (list.length === 0) return <span className="text-gray-400">None</span>;

  const shown = open ? list : list.slice(0, SERIALS_SHOWN);
  const hidden = list.length - SERIALS_SHOWN;

  return (
    <div className="max-w-56 text-xs">
      <ul className="space-y-0.5 font-medium break-all">
        {shown.map((serial) => (
          <li key={serial}>{serial}</li>
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="mt-1 font-semibold text-brand hover:underline">
          {open ? 'Show fewer' : `${hidden} more`}
        </button>
      )}
    </div>
  );
};

// `mode` and `productid` come from the /admin/products/create and /admin/products/{id}/edit pages
const AdminProductManager = ({ mode = '', productid = '' }) => {
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(mode === 'create');
  const [editingItem, setEditingItem] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Search once typing pauses
  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: appliedSearch, type: typeFilter, status: statusFilter });
      const { ok, data } = await api(`/api/admin/products?${params}`);

      setProducts(data?.products || []);
      setDeals(data?.deals || []);
      setLoadFailed(!ok || data?.success === false);
    } catch (error) {
      console.error('Error loading products:', error);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, typeFilter, statusFilter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch, typeFilter, statusFilter]);

  // Opened from the edit page: find the item to edit, product first and then deal
  useEffect(() => {
    if (mode !== 'edit' || !productid) return;

    // The admin copy of the product: it carries the serial numbers the public one leaves out
    api(`/api/admin/products/${productid}`).then(({ ok, data }) => {
      if (ok && data?.product?.id) {
        setEditingItem({ ...data.product, type: data.type || 'product' });
      } else {
        showToast('That product could not be found', 'error');
      }
    });
  }, [mode, productid]);

  const allItems = useMemo(
    () => [...products.map((product) => ({ ...product, type: 'product' })), ...deals.map((deal) => ({ ...deal, type: 'deal' }))],
    [products, deals]
  );

  const totalPages = Math.max(1, Math.ceil(allItems.length / PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageItems = allItems.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasFilters = Boolean(appliedSearch) || typeFilter !== 'all' || statusFilter !== 'all';

  const closeForms = () => {
    setShowCreateForm(false);
    setEditingItem(null);
    // Leave the create or edit address so a refresh shows the list
    if (mode) window.history.replaceState({}, '', '/admin/products');
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);

    try {
      const { ok, data } = await api(`/api/admin/${deleting.type}s/${deleting.id}`, { method: 'DELETE' });
      if (ok) {
        showToast(data?.message || 'Item deleted');
        loadItems(); // Refresh list
      } else {
        showToast(data?.message || 'Could not delete the item', 'error');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('Could not delete the item', 'error');
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  // Show create form if requested
  if (showCreateForm) {
    return (
      <AdminProductCreate
        onCancel={closeForms}
        onSuccess={() => {
          closeForms();
          loadItems(); // Reload the products list
        }}
      />
    );
  }

  // Show edit form if requested
  if (editingItem) {
    return (
      <AdminProductEdit
        item={editingItem}
        onCancel={closeForms}
        onSuccess={() => {
          closeForms();
          loadItems(); // Reload the products list
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search, filters and the add button */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products and deals" label="Search products and deals" className="w-full sm:w-72" />
        <Tabs tabs={TYPE_TABS} value={typeFilter} onChange={setTypeFilter} label="Type" />
        <Select size="sm" aria-label="Stock" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="all">Any stock</option>
          <option value="in_stock">In stock</option>
          <option value="out_of_stock">Out of stock</option>
          <option value="no_photo">No photos yet</option>
        </Select>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {can('products.create') && (
            <Button variant="secondary" icon={ImportSquare} onClick={() => setImporting(true)}>
              Import
            </Button>
          )}
          {can('products.export') && (
            <Button variant="secondary" icon={ExportSquare} onClick={() => setExporting(true)}>
              Export
            </Button>
          )}
          {can('products.create') && (
            <Button icon={Add} onClick={() => setShowCreateForm(true)}>
              Add product
            </Button>
          )}
        </div>
      </div>

      {!loading && !loadFailed && (
        <p className="text-sm text-gray-600" aria-live="polite">
          <span className="font-semibold text-ink tabular-nums">{allItems.length.toLocaleString('en-NG')}</span> {allItems.length === 1 ? 'item' : 'items'}
        </p>
      )}

      {/* Products table */}
      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Price</Th>
            <Th>Condition</Th>
            <Th align="right">Stocked</Th>
            <Th align="right">Sold</Th>
            <Th>Remaining</Th>
            <Th>Serial numbers</Th>
            <Th>Listed by</Th>
            <Th align="right">
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton columns={9} />
          ) : loadFailed ? (
            <TableMessage columns={9}>
              <EmptyState title="We could not load the products" description="Check your connection and try again." action={<Button onClick={loadItems}>Try again</Button>} />
            </TableMessage>
          ) : pageItems.length === 0 ? (
            <TableMessage columns={9}>
              <EmptyState
                icon={Box}
                title={hasFilters ? 'Nothing matches' : 'No products yet'}
                description={hasFilters ? 'Try a different search or remove a filter.' : 'Add your first product and it will show up on the store.'}
                action={
                  !hasFilters &&
                  can('products.create') && (
                    <Button icon={Add} onClick={() => setShowCreateForm(true)}>
                      Add product
                    </Button>
                  )
                }
              />
            </TableMessage>
          ) : (
            pageItems.map((item) => {
              const discount = item.type === 'deal' ? discountPercent(item.old_price, item.price) : 0;
              // Products are counted; deals only say whether they are in stock
              const counted = item.type === 'product';
              const remaining = Number(item.stock_quantity) || 0;
              const sold = Number(item.units_sold) || 0;

              return (
                <tr key={`${item.type}-${item.id}`} className="border-b border-gray-100 last:border-0">
                  <Td>
                    <div className="flex min-w-56 items-center gap-3">
                      <ProductImage src={item.images_url?.[0]} className="size-12 rounded-xl" iconSize={18} />
                      <div className="min-w-0">
                        <p className="max-w-72 truncate font-semibold">{item.product_name}</p>
                        <p className="flex items-center gap-2 text-xs text-gray-500">
                          {item.type === 'deal' && <Badge tone="brand">Deal</Badge>}
                          <span className="truncate">{item.category?.name || 'No category'}</span>
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap tabular-nums">
                    <span className="font-semibold">{formatPrice(item.display_price ?? item.price)}</span>
                    {discount > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        <s>{formatPrice(item.old_price)}</s> <span className="font-semibold text-sale">-{discount}%</span>
                      </span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-gray-600">{conditionLabel(item.product_status)}</Td>
                  {/* Stocked is everything ever put on sale: what is left plus what has been sold */}
                  <Td align="right" className="text-gray-600 tabular-nums">
                    {counted ? (remaining + sold).toLocaleString('en-NG') : <span className="text-gray-400">Not counted</span>}
                  </Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    {counted ? sold.toLocaleString('en-NG') : ''}
                  </Td>
                  <Td className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {counted && <span className="font-semibold tabular-nums">{remaining.toLocaleString('en-NG')}</span>}
                      <StockBadge inStock={item.in_stock} />
                    </div>
                  </Td>
                  <Td>
                    <SerialList serials={item.serial_numbers} />
                  </Td>
                  <Td className="whitespace-nowrap">
                    {item.listed_by?.name ? (
                      <p className="max-w-40 truncate font-medium" title={item.listed_by.email || undefined}>
                        {item.listed_by.name}
                      </p>
                    ) : (
                      <p className="text-gray-400">Not recorded</p>
                    )}
                    <p className="text-xs text-gray-500">{formatDate(item.created_at)}</p>
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      {can('products.edit') && <IconButton icon={Edit2} label={`Edit ${item.product_name}`} onClick={() => setEditingItem(item)} />}
                      {can('products.delete') && <IconButton icon={Trash} tone="danger" label={`Delete ${item.product_name}`} onClick={() => setDeleting(item)} />}
                    </div>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      <Pagination page={page} totalPages={totalPages} onChange={setCurrentPage} />

      {exporting && <ProductExportDialog count={products.length} filters={{ search: appliedSearch, status: statusFilter }} onClose={() => setExporting(false)} />}

      {importing && (
        <ProductImportDialog
          onClose={() => setImporting(false)}
          onImported={() => {
            setImporting(false);
            loadItems(); // Show the new products
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete this ${deleting.type}?`}
          message={`"${deleting.product_name}" will be removed from the store. This cannot be undone.`}
          confirmLabel="Delete"
          tone="danger"
          loading={deleteBusy}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
};

export default AdminProductManager;
