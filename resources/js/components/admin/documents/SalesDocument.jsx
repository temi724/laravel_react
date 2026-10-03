import React, { useState } from 'react';
import { formatPrice } from '../../../lib/admin';
import store from '../../../lib/store';

// The paper document behind both the invoice and the in-store receipt, so the two always match.
// It is styled by resources/css/document.css with plain hex colours only (see the note there):
// do not add Tailwind colour classes in here, the PDF export cannot read them.
//
//   kind      "Invoice" or "Receipt"
//   number    the order ID or receipt number
//   date      already formatted, e.g. "1 October 2026"
//   status    { label, tone } where tone is success, warning, danger or neutral
//   customer  { name, lines: [] }  lines are email, phone, address
//   facts     [{ label, value }]   shown in the two columns beside the customer
//   items     [{ name, note, serials, quantity, price, subtotal }]  serials (a list or ready text) are printed under the item
//   totals    [{ label, value }]   rows above the grand total (values are numbers)
//   total     the grand total (number)
//   bank      true to show the transfer details (for unpaid invoices)
//   notes     free text shown under the items
const SalesDocument = ({ id, kind, number, date, status, customer, facts = [], items = [], totals = [], total = 0, totalLabel = 'Total', bank = false, notes = '' }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const details = store();

  const half = Math.ceil(facts.length / 2);
  const factColumns = [facts.slice(0, half), facts.slice(half)];

  return (
    <article id={id} className="doc">
      <header className="doc-head">
        <div>
          {!logoFailed && <img src="/images/murphylogo.png" alt="" className="doc-logo" onError={() => setLogoFailed(true)} />}
          <p className="doc-brand-name">{details.legal_name || details.name}</p>
          <p className="doc-brand-meta">
            {details.address.line}
            <br />
            {details.address.area}
            <br />
            {details.phone_display}
          </p>
        </div>

        <div className="doc-title">
          <p className="doc-kind">{kind}</p>
          <p className="doc-number">{number}</p>
          <p className="doc-date">{date}</p>
        </div>
      </header>

      <section className="doc-meta">
        <div>
          <p className="doc-label">{kind === 'Receipt' ? 'Customer' : 'Billed to'}</p>
          <p className="doc-value">{customer?.name || 'Walk-in customer'}</p>
          {(customer?.lines || []).filter(Boolean).map((line, index) => (
            <p key={index} className="doc-sub">
              {line}
            </p>
          ))}
        </div>

        {factColumns.map((column, columnIndex) => (
          <div key={columnIndex}>
            {column.map((fact) => (
              <div key={fact.label} className="doc-fact">
                <p className="doc-label">{fact.label}</p>
                <p className="doc-value">{fact.value}</p>
              </div>
            ))}
            {columnIndex === 1 && status && (
              <div className="doc-fact">
                <p className="doc-label">Status</p>
                <span className={`doc-pill doc-pill-${status.tone || 'neutral'}`}>{status.label}</span>
              </div>
            )}
          </div>
        ))}
      </section>

      <table className="doc-items">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" className="doc-num">
              Qty
            </th>
            <th scope="col" className="doc-num">
              Unit price
            </th>
            <th scope="col" className="doc-num">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr key={index}>
                <td>
                  <p className="doc-item-name">{item.name || 'Product'}</p>
                  {item.note && <p className="doc-item-note">{item.note}</p>}
                  {item.serials?.length > 0 && <p className="doc-item-serial">S/N {Array.isArray(item.serials) ? item.serials.join(', ') : item.serials}</p>}
                </td>
                <td className="doc-num">{item.quantity}</td>
                <td className="doc-num">{formatPrice(item.price)}</td>
                <td className="doc-num">{formatPrice(item.subtotal)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="doc-empty">
                No items yet
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="doc-summary">
        <div className="doc-aside">
          {bank && (
            <div className="doc-box">
              <p className="doc-box-title">Pay by bank transfer</p>
              <p className="doc-account">{details.bank.account_number}</p>
              <p>
                {details.bank.bank_name}
                <br />
                {details.bank.account_name}
              </p>
            </div>
          )}
          {notes && (
            <div className="doc-box">
              <p className="doc-box-title">Notes</p>
              <p style={{ whiteSpace: 'pre-line' }}>{notes}</p>
            </div>
          )}
        </div>

        <div className="doc-totals">
          {totals.map((row) => (
            <div key={row.label} className="doc-total-row">
              <span>{row.label}</span>
              <span>{typeof row.value === 'number' ? formatPrice(row.value) : row.value}</span>
            </div>
          ))}
          <div className="doc-grand">
            <span>{totalLabel}</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        </div>
      </div>

      <div className="doc-foot-spacer" />

      <footer className="doc-foot">
        <p className="doc-thanks">Thank you for your business.</p>
        <p style={{ textAlign: 'right' }}>
          {details.website}
          <br />
          {details.email}
        </p>
      </footer>
    </article>
  );
};

export default SalesDocument;
