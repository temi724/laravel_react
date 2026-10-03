// Turns a document on the page (an element with the .doc class) into an A4 PDF download.
// html2pdf.js is loaded on first use so it stays out of the main bundle.
let html2pdfModule = null;

const loadHtml2Pdf = async () => {
  if (!html2pdfModule) {
    const module = await import('html2pdf.js');
    html2pdfModule = module.default || module;
  }
  return html2pdfModule;
};

export const downloadDocumentPdf = async (element, filename) => {
  if (!element) throw new Error('Document element not found');

  const html2pdf = await loadHtml2Pdf();
  if (typeof html2pdf !== 'function') throw new Error('html2pdf library failed to load properly');

  // Make sure Manrope is ready, otherwise the first export falls back to a system font
  if (document.fonts?.ready) await document.fonts.ready;

  await html2pdf()
    .set({
      margin: 0, // the sheet has its own padding
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        // html2canvas always reads the page's own background, and cannot parse the oklch colour
        // Tailwind gives it. In its private copy of the page, give html and body plain hex colours.
        onclone: (clonedDocument) => {
          clonedDocument.documentElement.style.backgroundColor = '#ffffff';
          clonedDocument.body.style.backgroundColor = '#ffffff';
          clonedDocument.body.style.color = '#14171c';
        },
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .save();
};

// Downloads a PDF the server has drawn (sharp, selectable text and a small file), e.g. /admin/invoice/{id}/pdf.
export const downloadServerPdf = async (url, filename) => {
  const response = await fetch(url, { headers: { Accept: 'application/pdf' }, credentials: 'same-origin' });
  const type = response.headers.get('content-type') || '';
  if (!response.ok || !type.includes('pdf')) throw new Error(`The server did not return a PDF (${response.status})`);

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

// Prints one document and nothing else. A copy of the sheet is placed straight under <body>, so it
// prints the same wherever the original sits (inside a dialog, a scrolling panel, scaled to fit).
// The print rules are in resources/css/document.css.
export const printDocument = (element, title) => {
  if (!element) return;

  document.querySelectorAll('.doc-print-root').forEach((stale) => stale.remove());

  const copy = element.cloneNode(true);
  copy.removeAttribute('id');
  const root = document.createElement('div');
  root.className = 'doc-print-root';
  root.appendChild(copy);
  document.body.appendChild(root);

  // The title becomes the suggested file name when printing to PDF
  const originalTitle = document.title;
  if (title) document.title = title;
  document.body.classList.add('printing-document');

  // Restore the page after the print dialog closes
  window.addEventListener(
    'afterprint',
    () => {
      document.body.classList.remove('printing-document');
      document.title = originalTitle;
      root.remove();
    },
    { once: true },
  );

  window.print();
};

export default downloadDocumentPdf;
