import React, { useEffect, useMemo, useState } from 'react';
import { ExportSquare } from 'iconsax-react';
import { Alert, Button, Checkbox, Modal, Skeleton } from './ui';
import { api, downloadFile } from '../../lib/admin';
import { showToast } from '../../lib/toast';

const REMEMBERED = 'murphylog-export-columns';

// The columns ticked last time, so a regular export is two clicks
const remembered = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(REMEMBERED));
    return Array.isArray(saved) ? saved : null;
  } catch (error) {
    return null;
  }
};

// Export the products table to Excel, with the columns the admin ticks.
// `filters` is the table's current { search, status }, so the file matches what is on screen.
const ProductExportDialog = ({ count, filters, onClose }) => {
  const [fields, setFields] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api('/api/admin/products-export/fields')
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.message || 'We could not load the columns. Close this and try again.');
          return;
        }

        const available = data.fields || [];
        const keys = available.map((field) => field.key);
        const saved = (remembered() || []).filter((key) => keys.includes(key));
        setFields(available);
        setSelected(saved.length > 0 ? saved : available.filter((field) => field.default).map((field) => field.key));
      })
      .catch(() => !cancelled && setError('We could not load the columns. Check your connection and try again.'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(
    () =>
      fields.reduce((list, field) => {
        const group = list.find((entry) => entry.name === field.group);
        if (group) group.items.push(field);
        else list.push({ name: field.group, items: [field] });
        return list;
      }, []),
    [fields]
  );

  const toggle = (key, on) => setSelected((prev) => (on ? [...new Set([...prev, key])] : prev.filter((value) => value !== key)));

  const exportNow = async () => {
    if (exporting || selected.length === 0) return;

    setExporting(true);
    setError('');
    try {
      const params = new URLSearchParams({ search: filters.search || '', status: filters.status || 'all' });
      selected.forEach((key) => params.append('fields[]', key));

      await downloadFile(`/api/admin/products-export?${params}`, 'products.xlsx');

      try {
        localStorage.setItem(REMEMBERED, JSON.stringify(selected));
      } catch (storageError) {
        // Remembering the columns is a convenience; the export itself worked
      }
      showToast('Export downloaded');
      onClose();
    } catch (downloadError) {
      setError(downloadError.message || 'The export could not be created. Try again.');
      setExporting(false);
    }
  };

  return (
    <Modal
      title="Export to Excel"
      description={`The file lists the ${count.toLocaleString('en-NG')} ${count === 1 ? 'product' : 'products'} in the table now, with your search and filter applied. Choose the columns it should have.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={exporting}>
            Cancel
          </Button>
          <Button icon={ExportSquare} loading={exporting} disabled={loading || selected.length === 0 || count === 0} onClick={exportNow}>
            {exporting ? 'Creating file' : 'Export'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading columns">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          fields.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-gray-600 tabular-nums" aria-live="polite">
                  {selected.length} of {fields.length} columns chosen
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(fields.map((field) => field.key))}>
                    Select all
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                    Clear
                  </Button>
                </div>
              </div>

              {groups.map((group) => (
                <fieldset key={group.name}>
                  <legend className="text-xs font-semibold text-gray-500">{group.name}</legend>
                  <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    {group.items.map((field) => (
                      <Checkbox key={field.key} checked={selected.includes(field.key)} onChange={(on) => toggle(field.key, on)} label={field.label} />
                    ))}
                  </div>
                </fieldset>
              ))}

              {selected.length === 0 && <p className="text-sm text-sale">Choose at least one column.</p>}
            </>
          )
        )}
      </div>
    </Modal>
  );
};

export default ProductExportDialog;
