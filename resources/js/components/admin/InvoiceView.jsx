import React, { useEffect, useState } from 'react';
import { Add, DocumentDownload, Printer } from 'iconsax-react';
import DocumentDesk from './documents/DocumentDesk';
import SalesDocument from './documents/SalesDocument';
import { Button } from './ui';
import { formatLongDate, lineNote, parseOrderDetails, saleTotal, serialText } from '../../lib/admin';
import { downloadDocumentPdf, downloadServerPdf, printDocument } from '../../lib/pdf';
import { showToast } from '../../lib/toast';

const PAYMENT_STATUS = {
  completed: { label: 'Paid', tone: 'success' },
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Payment pending', tone: 'warning' },
  failed: { label: 'Payment failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};

const sentence = (value) => {
  const text = String(value || '').replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// The invoice for a sale. Serial numbers are not typed here: they come from the products
// and are put on the sale when the order is confirmed.
const InvoiceView = ({ sale, onClose }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Escape closes the dialog and the page behind does not scroll
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const number = sale.order_id || sale.receipt_number || sale.id;
  const isOffline = sale.sale_type === 'offline';
  const paid = sale.payment_status === 'completed' || sale.payment_status === 'paid';
  const subtotal = saleTotal(sale);

  const items = parseOrderDetails(sale.order_details).map((item) => ({
    name: item.name,
    note: lineNote(item),
    serials: serialText(item),
    quantity: item.quantity || 1,
    price: item.price || 0,
    subtotal: item.subtotal ?? (item.price || 0) * (item.quantity || 1),
  }));

  // In-store sales save "In-Store" as the place; that is not an address worth printing
  const place = [sale.city, sale.state].filter((part) => part && part !== 'In-Store').join(', ');
  const address = sale.order_type === 'delivery' && sale.location && sale.location !== 'In-Store' ? sale.location : sale.address;

  // Handle print
  const handlePrint = () => {
    printDocument(document.getElementById('invoice-content'), `Invoice ${number}`);
  };

  // Handle PDF download
  const handleDownload = async () => {
    if (isGeneratingPdf) return; // Prevent multiple concurrent downloads

    try {
      setIsGeneratingPdf(true);
      const filename = `invoice-${number}.pdf`;

      // The server draws the sharper PDF. If it cannot, build one from the page instead.
      try {
        await downloadServerPdf(`/admin/invoice/${encodeURIComponent(sale.id)}/pdf`, filename);
      } catch (serverError) {
        console.warn('Server PDF unavailable, creating it in the browser:', serverError.message || serverError);
        await downloadDocumentPdf(document.getElementById('invoice-content'), filename);
      }
      showToast('Invoice downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error.message || error);
      showToast('The invoice could not be created. Try again.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-title"
        className="flex max-h-[94dvh] w-full max-w-[890px] animate-rise flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with action buttons */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
          <h2 id="invoice-title" className="text-lg font-extrabold tracking-tight">
            Invoice
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
              Print
            </Button>
            <Button size="sm" icon={DocumentDownload} loading={isGeneratingPdf} onClick={handleDownload}>
              {isGeneratingPdf ? 'Creating PDF' : 'Save as PDF'}
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink"
            >
              <Add size={24} color="currentColor" variant="Linear" className="rotate-45" />
            </button>
          </div>
        </div>

        {/* The page, on a grey desk. The scrollbar keeps its place so the sheet does not jump as it is fitted. */}
        <DocumentDesk className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          <SalesDocument
            id="invoice-content"
            kind="Invoice"
            number={number}
            date={formatLongDate(sale.created_at)}
            status={PAYMENT_STATUS[sale.payment_status] || { label: sentence(sale.payment_status) || 'Unknown', tone: 'neutral' }}
            customer={{ name: sale.username, lines: [sale.emailaddress, sale.phonenumber, address, place] }}
            facts={[
              { label: 'Order', value: sale.order_status ? 'Completed' : 'In progress' },
              { label: isOffline ? 'Sold' : 'Collection', value: isOffline ? 'In store' : sentence(sale.order_type || 'pickup') },
              { label: 'Payment method', value: sentence(sale.payment_method || 'bank transfer') },
            ]}
            items={items}
            totals={[{ label: 'Subtotal', value: subtotal }]}
            total={subtotal}
            totalLabel={paid ? 'Total paid' : 'Total due'}
            bank={!paid}
            notes={sale.notes}
          />
        </DocumentDesk>
      </div>
    </div>
  );
};

export default InvoiceView;
