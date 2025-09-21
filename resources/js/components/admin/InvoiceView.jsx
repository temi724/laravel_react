import React, { useState } from 'react';

// Import html2pdf statically to avoid dynamic import issues
let html2pdf = null;
const loadHtml2Pdf = async () => {
    if (!html2pdf) {
        try {
            const module = await import('html2pdf.js');
            html2pdf = module.default || module;
        } catch (error) {
            console.error('Failed to load html2pdf:', error);
            throw error;
        }
    }
    return html2pdf;
};

const InvoiceView = ({ sale, onClose }) => {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    // Parse order details safely
    const parseOrderDetails = (orderDetails) => {
        if (!orderDetails) return [];
        if (typeof orderDetails === 'string') {
            try {
                return JSON.parse(orderDetails);
            } catch (e) {
                return [];
            }
        }
        return Array.isArray(orderDetails) ? orderDetails : [];
    };

    // Calculate order total
    const calculateOrderTotal = (orderDetails) => {
        const details = parseOrderDetails(orderDetails);
        return details.reduce((total, item) => {
            return total + (parseFloat(item.subtotal || 0));
        }, 0);
    };

    // Format Nigerian Naira
    const formatNGN = (amount) => {
        return `₦${parseFloat(amount || 0).toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Handle print
    const handlePrint = () => {
        // Store original title
        const originalTitle = document.title;

        // Set a clean title for printing
        document.title = `Invoice-${sale.order_id} - Murphylog Global Concept`;

        // Add a class to the body to hide everything except invoice content
        document.body.classList.add('printing-invoice');

        // Trigger print
        window.print();

        // Remove the class and restore title after printing
        setTimeout(() => {
            document.body.classList.remove('printing-invoice');
            document.title = originalTitle;
        }, 1000);
    };

    // Handle PDF download (using html2pdf.js for better layout)
    const handleDownload = async () => {
        if (isGeneratingPdf) return; // Prevent multiple concurrent downloads

        try {
            setIsGeneratingPdf(true);

            // Validate required data
            if (!sale || !sale.id) {
                console.error('Sale data is missing or invalid');
                alert('Cannot generate PDF: Sale data is missing');
                return;
            }

            // Get the original invoice element and work with it directly
            const originalInvoice = document.getElementById('invoice-content');
            if (!originalInvoice) {
                console.error('Invoice element not found');
                alert('Cannot generate PDF: Invoice content not found');
                return;
            }

            // Load html2pdf library
            try {
                html2pdf = await loadHtml2Pdf();

                // Verify html2pdf is properly loaded
                if (!html2pdf || typeof html2pdf !== 'function') {
                    throw new Error('html2pdf library failed to load properly');
                }

                console.log('html2pdf loaded successfully:', typeof html2pdf);
            } catch (importError) {
                console.error('Failed to import html2pdf:', importError);
                alert('Failed to load PDF library. Please refresh the page and try again.');
                return;
            }

            // Create a comprehensive style override to eliminate oklch colors
            const styleOverrideId = 'pdf-generation-override';
            let existingStyleOverride = document.getElementById(styleOverrideId);
            if (existingStyleOverride) {
                existingStyleOverride.remove();
            }

            const styleOverride = document.createElement('style');
            styleOverride.id = styleOverrideId;
            styleOverride.textContent = `
                /* Force all colors to safe RGB values during PDF generation */
                body.printing-invoice #invoice-content,
                body.printing-invoice #invoice-content * {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    border-color: #000000 !important;
                    font-family: Arial, sans-serif !important;
                    box-shadow: none !important;
                    outline: none !important;
                    text-shadow: none !important;
                }

                body.printing-invoice #invoice-content table {
                    border-collapse: collapse !important;
                    width: 100% !important;
                }

                body.printing-invoice #invoice-content th {
                    background-color: #f0f0f0 !important;
                    color: #000000 !important;
                    font-weight: bold !important;
                    border: 1px solid #000000 !important;
                    padding: 12px 8px !important;
                }

                body.printing-invoice #invoice-content td {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    border: 1px solid #000000 !important;
                    padding: 12px 8px !important;
                }

                body.printing-invoice #invoice-content img {
                    max-width: 80px !important;
                    height: auto !important;
                    border: none !important;
                }

                /* Override any Tailwind or CSS custom properties */
                body.printing-invoice #invoice-content * {
                    --tw-bg-opacity: 1 !important;
                    --tw-text-opacity: 1 !important;
                    --tw-border-opacity: 1 !important;
                }
            `;

            document.head.appendChild(styleOverride);

            // Use the original invoice element
            const invoiceElement = originalInvoice;

            // Hide all page elements except invoice
            document.body.classList.add('printing-invoice');

            // Configure html2pdf options for simple and reliable generation
            const opt = {
                margin: [0.5, 0.5, 0.5, 0.5],
                filename: `invoice-${sale.id}.pdf`,
                image: {
                    type: 'jpeg',
                    quality: 0.98
                },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    foreignObjectRendering: false,
                    backgroundColor: '#ffffff',
                    width: 800,
                    height: invoiceElement.offsetHeight || 1000,
                    onclone: function(clonedDoc) {
                        // In the cloned document, ensure all styles are safe
                        const allElements = clonedDoc.querySelectorAll('*');
                        allElements.forEach(el => {
                            // Remove any CSS custom properties that might cause issues
                            if (el.style) {
                                el.style.color = '#000000';
                                el.style.backgroundColor = el.tagName === 'TH' ? '#f0f0f0' : '#ffffff';
                                el.style.borderColor = '#000000';
                            }
                        });
                    }
                },
                jsPDF: {
                    unit: 'in',
                    format: 'letter',
                    orientation: 'portrait'
                }
            };

            console.log('Generating PDF with options:', opt);
            console.log('html2pdf function:', typeof html2pdf);

            // Generate PDF directly from the original element with our body class applied
            await html2pdf().set(opt).from(invoiceElement).save();

            console.log('PDF generated successfully!');
            alert('PDF downloaded successfully!');

        } catch (error) {
            console.error('Error generating PDF:', error.message || error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                saleData: sale ? { id: sale.id, order_details: sale.order_details } : 'No sale data'
            });
            alert('Error generating PDF. Please check the console for details.');
        } finally {
            // Clean up
            setIsGeneratingPdf(false);
            document.body.classList.remove('printing-invoice');
            const styleElement = document.getElementById('pdf-generation-override');
            if (styleElement) {
                styleElement.remove();
            }
        }
    };

    const orderDetails = parseOrderDetails(sale.order_details);
    const total = calculateOrderTotal(sale.order_details);

    return (
        <div
            className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none print:overflow-visible"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with action buttons - hidden during print */}
                <div className="flex justify-between items-center p-6 border-b print:hidden">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Invoice #{sale.order_id}
                    </h2>
                    <div className="flex space-x-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={isGeneratingPdf}
                            className={`flex items-center px-4 py-2 text-white rounded-lg transition-colors ${
                                isGeneratingPdf
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {isGeneratingPdf ? (
                                <>
                                    <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Save as PDF
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Invoice content - optimized for printing and PDF */}
                <div
                    className="p-8 print:p-6 bg-white"
                    id="invoice-content"
                    style={{
                        minHeight: '800px',
                        width: '800px',
                        margin: '0 auto',
                        backgroundColor: '#ffffff',
                        border: 'none',
                        boxShadow: 'none'
                    }}
                >
                    {/* Company Header */}
                    <div className="text-center mb-8 border-b-2 border-gray-900 pb-6 company-header">
                        <div className="flex justify-center items-center mb-4" style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <img
                                src="/images/murphylogo.png"
                                alt="Murphy Log Global"
                                className="h-16 w-auto mr-4"
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    marginRight: '16px',
                                    objectFit: 'contain'
                                }}
                            />
                            <div style={{ textAlign: 'left' }}>
                                <div
                                    className="text-3xl font-bold text-blue-600 mb-1 company-name"
                                    style={{
                                        fontSize: '28px',
                                        fontWeight: 'bold',
                                        color: '#2563eb',
                                        lineHeight: '1.2',
                                        marginBottom: '8px'
                                    }}
                                >
                                    MURPHYLOG GLOBAL CONCEPT
                                </div>
                                <div
                                    className="text-gray-600 text-sm"
                                    style={{
                                        fontSize: '14px',
                                        color: '#6b7280',
                                        lineHeight: '1.4'
                                    }}
                                >
                                    Premium Electronics & Technology Solutions
                                </div>
                            </div>
                        </div>
                        <div
                            className="text-4xl font-bold text-gray-900"
                            style={{
                                fontSize: '32px',
                                fontWeight: 'bold',
                                color: '#111827',
                                marginTop: '16px'
                            }}
                        >
                            INVOICE
                        </div>
                    </div>

                    {/* Invoice Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Invoice Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                                Invoice Information
                            </h3>
                            <div className="space-y-2">
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-20">Invoice #:</span>
                                    <span className="text-gray-900">{sale.order_id}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-20">Date:</span>
                                    <span className="text-gray-900">{formatDate(sale.created_at)}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-20">Status:</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        sale.payment_status === 'paid'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {sale.payment_status === 'paid' ? 'Paid' : sale.payment_status?.charAt(0).toUpperCase() + sale.payment_status?.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                                Bill To
                            </h3>
                            <div className="space-y-2">
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-16">Name:</span>
                                    <span className="text-gray-900">{sale.username || 'N/A'}</span>
                                </div>
                                <div className="flex">
                                    <span className="font-medium text-gray-700 w-16">Email:</span>
                                    <span className="text-gray-900">{sale.emailaddress || 'N/A'}</span>
                                </div>
                                {sale.phonenumber && (
                                    <div className="flex">
                                        <span className="font-medium text-gray-700 w-16">Phone:</span>
                                        <span className="text-gray-900">{sale.phonenumber}</span>
                                    </div>
                                )}
                                {(sale.city || sale.state) && (
                                    <div className="flex">
                                        <span className="font-medium text-gray-700 w-16">Location:</span>
                                        <span className="text-gray-900">
                                            {sale.city}{sale.city && sale.state ? ', ' : ''}{sale.state}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                                        Item
                                    </th>
                                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">
                                        Price
                                    </th>
                                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                                        Quantity
                                    </th>
                                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderDetails.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-4 py-3 text-gray-900">
                                            {item.name || 'Product'}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-3 text-right text-gray-900">
                                            {formatNGN(item.price || 0)}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">
                                            {item.quantity || 1}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-3 text-right text-gray-900 font-medium">
                                            {formatNGN(item.subtotal || 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Total Section */}
                    <div className="border-t-2 border-gray-900 pt-4 mb-8">
                        <div className="flex justify-end">
                            <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                    <span className="text-lg font-medium">Total: </span>
                                    <span className="text-blue-600">{formatNGN(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-300 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            {/* Company Info */}
                            <div style={{ minWidth: '250px' }}>
                                <h4 className="font-semibold text-gray-900 mb-3" style={{ fontSize: '16px', fontWeight: '600' }}>Company Information</h4>
                                <div className="text-sm text-gray-700 space-y-1" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                    <p className="font-medium" style={{ fontWeight: '500' }}>Murphy Log Global</p>
                                    <p>12, Ola ayeni street</p>
                                    <p>Lagos State</p>
                                    <p>Nigeria</p>
                                    <p style={{ wordBreak: 'break-word' }}>Email: info@murphylogglobal.com</p>
                                    <p>Phone: +2348024913553</p>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div style={{ minWidth: '250px' }}>
                                <h4 className="font-semibold text-gray-900 mb-3" style={{ fontSize: '16px', fontWeight: '600' }}>Banking Information</h4>
                                <div className="text-sm text-gray-700 space-y-1" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                    <p style={{ wordBreak: 'break-word' }}><span className="font-medium" style={{ fontWeight: '500' }}>Bank Name:</span> Providus Bank</p>
                                    <p style={{ wordBreak: 'break-word' }}><span className="font-medium" style={{ fontWeight: '500' }}>Account Name:</span> Murphylog Global Concept</p>
                                    <p style={{ wordBreak: 'break-word', letterSpacing: '0.5px' }}><span className="font-medium" style={{ fontWeight: '500' }}>Account Number:</span> 5401799184</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center border-t border-gray-200 pt-4">
                            <p className="font-semibold text-gray-900 mb-2">Thank you for your business!</p>
                            <p className="text-sm text-gray-600">
                                Your trusted partner in technology solutions
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS overrides to fix oklch color issues for PDF generation */}
            <style jsx global>{`
                /* Override oklch colors with supported RGB/HEX colors for PDF generation */
                body.printing-invoice * {
                    /* Force all text colors to safe values */
                    color: #000000 !important;
                }

                body.printing-invoice #invoice-content {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                }

                body.printing-invoice .bg-blue-600,
                body.printing-invoice .text-blue-600 {
                    background-color: #2563eb !important;
                    color: #2563eb !important;
                }

                body.printing-invoice .bg-green-600,
                body.printing-invoice .text-green-600 {
                    background-color: #16a34a !important;
                    color: #16a34a !important;
                }

                body.printing-invoice .bg-gray-100,
                body.printing-invoice .text-gray-600,
                body.printing-invoice .text-gray-700,
                body.printing-invoice .text-gray-800,
                body.printing-invoice .text-gray-900 {
                    background-color: #f3f4f6 !important;
                    color: #374151 !important;
                }

                body.printing-invoice .border-gray-200 {
                    border-color: #e5e7eb !important;
                }

                /* Remove any CSS variables that might contain oklch */
                body.printing-invoice * {
                    --tw-bg-opacity: 1 !important;
                    --tw-text-opacity: 1 !important;
                    --tw-border-opacity: 1 !important;
                }

                /* Force safe color values for all elements */
                body.printing-invoice table {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                }

                body.printing-invoice th {
                    background-color: #f3f4f6 !important;
                    color: #111827 !important;
                }

                body.printing-invoice td {
                    background-color: #ffffff !important;
                    color: #374151 !important;
                }

                /* Override any remaining Tailwind color utilities */
                body.printing-invoice .text-slate-600,
                body.printing-invoice .text-slate-700,
                body.printing-invoice .text-slate-800,
                body.printing-invoice .text-slate-900 {
                    color: #374151 !important;
                }

                body.printing-invoice .bg-slate-50,
                body.printing-invoice .bg-slate-100 {
                    background-color: #f8fafc !important;
                }

                /* Ensure no CSS custom properties with oklch values */
                body.printing-invoice * {
                    background: unset !important;
                    color: unset !important;
                }

                /* Re-apply safe colors after unsetting */
                body.printing-invoice #invoice-content * {
                    color: #000000 !important;
                }

                body.printing-invoice #invoice-content {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                }
            `}</style>

            {/* Enhanced print styles - completely hide unwanted elements */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0.3in;
                        size: A4;
                        -webkit-print-color-adjust: exact;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Hide everything first */
                    body * {
                        visibility: hidden !important;
                    }

                    /* Only show invoice content */
                    body.printing-invoice #invoice-content,
                    body.printing-invoice #invoice-content * {
                        visibility: visible !important;
                    }

                    /* Position invoice content for print */
                    body.printing-invoice #invoice-content {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        padding: 20px !important;
                        margin: 0 !important;
                        max-width: none !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        background: white !important;
                    }

                    /* Hide all navigation, headers, footers */
                    body.printing-invoice nav,
                    body.printing-invoice header,
                    body.printing-invoice footer,
                    body.printing-invoice aside,
                    body.printing-invoice [class*="sidebar"],
                    body.printing-invoice [class*="navigation"],
                    body.printing-invoice [class*="header"],
                    body.printing-invoice [class*="footer"],
                    body.printing-invoice [data-testid],
                    body.printing-invoice .fixed,
                    body.printing-invoice .sticky {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    /* Hide any text that might contain "Dashboard" or "Laravel" */
                    body.printing-invoice *:not(#invoice-content):not(#invoice-content *) {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    .print\\:hidden {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    .print\\:p-6 {
                        padding: 1.5rem !important;
                    }

                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }

                    .print\\:max-w-none {
                        max-width: none !important;
                    }

                    .print\\:max-h-none {
                        max-height: none !important;
                    }

                    .print\\:overflow-visible {
                        overflow: visible !important;
                    }
                }

                /* Ensure PDF generation doesn't show modal borders */
                #invoice-content {
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                }
            `}</style>
        </div>
    );
};

export default InvoiceView;
