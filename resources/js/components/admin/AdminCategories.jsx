import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Add, Edit2, Tag, Trash } from 'iconsax-react';
import { Alert, Button, Card, ConfirmDialog, EmptyState, Field, IconButton, Input, Modal, Pagination, SectionHeader, Table, TableMessage, TableSkeleton, Td, Th } from './ui';
import { api } from '../../lib/admin';
import { showToast } from '../../lib/toast';

const PER_PAGE = 10;

// First message of a failed request, whichever shape the server used
const problemOf = (data, fallback) => Object.values(data?.errors || {}).flat()[0] || data?.message || fallback;

// Add, rename and remove the categories products are listed under
const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [name, setName] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(null); // { id, name, error }
  const [renameBusy, setRenameBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const renameInput = useRef(null);

  // Ready to type as soon as the rename dialog opens (a frame later: the dialog takes the focus first)
  const renamingId = renaming?.id;
  useEffect(() => {
    if (!renamingId) return undefined;
    const frame = requestAnimationFrame(() => renameInput.current?.select());
    return () => cancelAnimationFrame(frame);
  }, [renamingId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, data } = await api('/api/admin/categories');
      setCategories(data?.categories || []);
      setLoadFailed(!ok);
    } catch (error) {
      console.error('Error loading categories:', error);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name));

  const add = async (event) => {
    event.preventDefault();
    if (adding) return;

    if (!name.trim()) {
      setAddError('Enter a name for the category.');
      return;
    }

    setAdding(true);
    setAddError('');
    try {
      const { ok, data } = await api('/api/categories', { method: 'POST', body: { name: name.trim() } });
      if (ok) {
        const next = sorted([...categories, data]);
        setCategories(next);
        // Open the page the new category landed on, so it is in view
        setCurrentPage(Math.floor(next.findIndex((category) => category.id === data.id) / PER_PAGE) + 1);
        setName('');
        showToast(`${data.name} added`);
      } else {
        setAddError(problemOf(data, 'We could not add the category. Try again.'));
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setAddError('We could not add the category. Check your connection and try again.');
    } finally {
      setAdding(false);
    }
  };

  const rename = async (event) => {
    event.preventDefault();
    if (!renaming || renameBusy) return;

    setRenameBusy(true);
    try {
      const { ok, data } = await api(`/api/categories/${renaming.id}`, { method: 'PUT', body: { name: renaming.name.trim() } });
      if (ok) {
        const next = sorted(categories.map((category) => (category.id === data.id ? data : category)));
        setCategories(next);
        // A new name can move it to another page: follow it there
        setCurrentPage(Math.floor(next.findIndex((category) => category.id === data.id) / PER_PAGE) + 1);
        setRenaming(null);
        showToast('Category renamed');
      } else {
        setRenaming((current) => ({ ...current, error: problemOf(data, 'We could not rename the category. Try again.') }));
      }
    } catch (error) {
      console.error('Error renaming category:', error);
      setRenaming((current) => ({ ...current, error: 'We could not rename the category. Check your connection and try again.' }));
    } finally {
      setRenameBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;

    setDeleteBusy(true);
    try {
      const { ok, data } = await api(`/api/categories/${deleting.id}`, { method: 'DELETE' });
      if (ok) {
        setCategories((prev) => prev.filter((category) => category.id !== deleting.id));
        showToast(`${deleting.name} deleted`);
      } else {
        showToast(problemOf(data, 'Could not delete the category'), 'error');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Could not delete the category', 'error');
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  // Deleting the last row of the last page steps back a page
  const totalPages = Math.max(1, Math.ceil(categories.length / PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageCategories = categories.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Add a category */}
      <Card>
        <SectionHeader title="Add a category" description="It appears in the store menu and in the category list when you add a product." />
        <form onSubmit={add} noValidate className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <Field label="Category name" error={addError} className="flex-1">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (addError) setAddError('');
              }}
              maxLength={100}
              placeholder="Smart watches"
              autoComplete="off"
            />
          </Field>
          <Button type="submit" size="lg" icon={Add} loading={adding} className="sm:mt-7">
            Add category
          </Button>
        </form>
      </Card>

      {!loading && !loadFailed && (
        <p className="text-sm text-gray-600" aria-live="polite">
          <span className="font-semibold text-ink tabular-nums">{categories.length}</span> {categories.length === 1 ? 'category' : 'categories'}
        </p>
      )}

      <Table>
        <thead>
          <tr>
            <Th>Category</Th>
            <Th align="right">Products</Th>
            <Th align="right">
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton columns={3} rows={PER_PAGE} />
          ) : loadFailed ? (
            <TableMessage columns={3}>
              <EmptyState title="We could not load the categories" description="Check your connection and try again." action={<Button onClick={load}>Try again</Button>} />
            </TableMessage>
          ) : categories.length === 0 ? (
            <TableMessage columns={3}>
              <EmptyState icon={Tag} title="No categories yet" description="Add your first category above. Every product needs one." />
            </TableMessage>
          ) : (
            pageCategories.map((category) => {
              const count = Number(category.products_count) || 0;

              return (
                <tr key={category.id} className="border-b border-gray-100 last:border-0">
                  <Td className="font-semibold">{category.name}</Td>
                  <Td align="right" className="text-gray-600">
                    {count.toLocaleString('en-NG')}
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton icon={Edit2} label={`Rename ${category.name}`} onClick={() => setRenaming({ id: category.id, name: category.name, error: '' })} />
                      <IconButton
                        icon={Trash}
                        tone="danger"
                        label={count > 0 ? `${category.name} cannot be deleted while it has products` : `Delete ${category.name}`}
                        disabled={count > 0}
                        onClick={() => setDeleting(category)}
                      />
                    </div>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      <Pagination page={page} totalPages={totalPages} onChange={setCurrentPage} />

      {!loading && pageCategories.some((category) => Number(category.products_count) > 0) && (
        <p className="text-xs text-gray-500">A category can only be deleted once it has no products.</p>
      )}

      {/* Rename */}
      {renaming && (
        <Modal title="Rename category" onClose={() => setRenaming(null)} size="sm">
          <form onSubmit={rename} noValidate className="space-y-4">
            {renaming.error && <Alert tone="error">{renaming.error}</Alert>}
            <Field label="Category name">
              <Input value={renaming.name} onChange={(e) => setRenaming((current) => ({ ...current, name: e.target.value, error: '' }))} maxLength={100} autoComplete="off" ref={renameInput} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRenaming(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={renameBusy} disabled={!renaming.name.trim()}>
                Save name
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this category?"
          message={`"${deleting.name}" will be removed from the store menu. This cannot be undone.`}
          confirmLabel="Delete"
          tone="danger"
          loading={deleteBusy}
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
};

export default AdminCategories;
