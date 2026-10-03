import React, { useState } from 'react';
import { DocumentDownload, DocumentUpload, ImportSquare } from 'iconsax-react';
import { Alert, Button, Modal, Spinner } from './ui';
import { api, downloadFile } from '../../lib/admin';
import { showToast } from '../../lib/toast';

const MAX_SIZE = 2 * 1024 * 1024;

const plural = (count, word) => `${count.toLocaleString('en-NG')} ${word}${count === 1 ? '' : 's'}`;

// List many products at once from an Excel file. The file is checked first and the admin sees
// what will be imported and which rows need fixing before anything is saved.
const ProductImportDialog = ({ onClose, onImported }) => {
  const [file, setFile] = useState(null);
  const [check, setCheck] = useState(null); // the server's answer to the dry run
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const send = (chosen, dryRun) => {
    const formData = new FormData();
    formData.append('file', chosen);
    if (dryRun) formData.append('dry_run', '1');
    return api('/api/admin/products-import', { method: 'POST', formData });
  };

  const problemOf = (data, fallback) => Object.values(data?.errors || {}).flat()[0] || data?.message || fallback;

  // Choosing a file checks it straight away
  const choose = async (chosen) => {
    if (!chosen) return;

    setFile(chosen);
    setCheck(null);
    setError('');

    if (!/\.(xlsx|csv)$/i.test(chosen.name)) {
      setError('That is not an Excel file. Save it as an Excel workbook (.xlsx) and try again.');
      return;
    }
    if (chosen.size > MAX_SIZE) {
      setError('The file is larger than 2MB. Split it into smaller files.');
      return;
    }

    setChecking(true);
    try {
      const { ok, data } = await send(chosen, true);
      if (ok && data?.success) setCheck(data);
      else setError(problemOf(data, 'We could not read that file. Try again.'));
    } catch (requestError) {
      console.error('Error checking import file:', requestError);
      setError('We could not read that file. Check your connection and try again.');
    } finally {
      setChecking(false);
    }
  };

  const importNow = async () => {
    if (!file || importing) return;

    setImporting(true);
    setError('');
    try {
      const { ok, data } = await send(file, false);
      if (ok && data?.success) {
        showToast(`${plural(data.imported, 'product')} imported. Edit each one to add its photos.`);
        onImported();
        return;
      }
      setError(problemOf(data, 'The import did not go through. Try again.'));
    } catch (requestError) {
      console.error('Error importing products:', requestError);
      setError('The import did not go through. Check your connection and try again.');
    }
    setImporting(false);
  };

  const downloadSample = async () => {
    setDownloading(true);
    try {
      await downloadFile('/api/admin/products-import/sample', 'product-import-sample.xlsx');
    } catch (downloadError) {
      showToast(downloadError.message || 'The sample file could not be downloaded', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const ready = check?.ready || 0;
  const problems = check?.problems || [];
  const preview = check?.preview || [];

  return (
    <Modal
      title="Import from Excel"
      description="List many products at once. Photos are not part of the file: after importing, edit each product to add them."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={importing}>
            Cancel
          </Button>
          <Button icon={ImportSquare} loading={importing} disabled={checking || ready === 0} onClick={importNow}>
            {importing ? 'Importing' : ready > 0 ? `Import ${plural(ready, 'product')}` : 'Import'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* The sample file */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-50 p-4">
          <div className="min-w-0">
            <p className="text-sm font-bold">Start from the sample file</p>
            <p className="text-sm text-gray-600">It has the right headings, two example rows and a guide to each column.</p>
          </div>
          <Button variant="secondary" size="sm" icon={DocumentDownload} loading={downloading} onClick={downloadSample}>
            Download sample
          </Button>
        </div>

        {/* Choose the file */}
        <label
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-7 text-center transition-colors ${
            file ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50 hover:border-brand hover:text-brand'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            choose(e.dataTransfer.files?.[0]);
          }}
        >
          <DocumentUpload size={28} color="currentColor" variant="Linear" className="text-gray-500" />
          {file ? (
            <>
              <span className="max-w-full truncate text-sm font-semibold text-ink">{file.name}</span>
              <span className="text-xs font-semibold text-brand">Choose another file</span>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold">Choose your Excel file, or drop it here</span>
              <span className="text-xs text-gray-500">.xlsx, up to 500 products and 2MB</span>
            </>
          )}
          <input
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="sr-only"
            onChange={(e) => {
              choose(e.target.files?.[0]);
              e.target.value = ''; // the same file can be chosen again after fixing it
            }}
          />
        </label>

        {checking && (
          <p className="flex items-center gap-2 text-sm text-gray-600" role="status">
            <Spinner /> Checking the file
          </p>
        )}

        {error && <Alert tone="error">{error}</Alert>}

        {/* What the check found */}
        {check && !checking && (
          <div className="space-y-3" aria-live="polite">
            {ready > 0 ? (
              <Alert tone="success" title={`${plural(ready, 'product')} ready to import`}>
                {preview.join(', ')}
                {ready > preview.length ? ` and ${ready - preview.length} more` : ''}
              </Alert>
            ) : (
              <Alert tone="info" title="Nothing to import yet">
                {problems.length > 0 ? 'Fix the rows below in your file, then choose it again.' : 'The file has no product rows. Add one product per row under the headings.'}
              </Alert>
            )}

            {problems.length > 0 && (
              <Alert tone="warning" title={`${plural(problems.length, 'row')} ${problems.length === 1 ? 'needs' : 'need'} fixing and will be skipped`}>
                <ul className="mt-2 max-h-56 space-y-2.5 overflow-y-auto pr-1 text-ink">
                  {problems.map((problem) => (
                    <li key={problem.row}>
                      <p className="font-semibold">
                        Row {problem.row}
                        {problem.name ? `: ${problem.name}` : ''}
                      </p>
                      {problem.messages.map((message) => (
                        <p key={message} className="text-gray-700">
                          {message}
                        </p>
                      ))}
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {check.skipped_examples > 0 && <p className="text-xs text-gray-500">{plural(check.skipped_examples, 'example row')} from the sample file {check.skipped_examples === 1 ? 'was' : 'were'} ignored.</p>}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProductImportDialog;
