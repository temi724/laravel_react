import React from 'react';

const InvoiceView = ({ sale, onClose }) => {
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
        // Add a class to the body to hide everything except invoice content
        document.body.classList.add('printing-invoice');

        // Trigger print
        window.print();

        // Remove the class after printing
        setTimeout(() => {
            document.body.classList.remove('printing-invoice');
        }, 1000);
    };

    // Handle PDF download (using browser print to PDF)
    const handleDownload = () => {
        // Open print dialog with suggestion to save as PDF
        if (window.navigator.userAgent.includes('Chrome')) {
            // Chrome users can save as PDF from print dialog
            window.print();
        } else {
            // For other browsers, open print dialog
            window.print();
        }
    };

    const orderDetails = parseOrderDetails(sale.order_details);
    const total = calculateOrderTotal(sale.order_details);

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-none print:max-h-none print:overflow-visible">
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
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Save as PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Invoice content - optimized for printing */}
                <div className="p-8 print:p-6" id="invoice-content">
                    {/* Company Header */}
                    <div className="text-center mb-8 border-b-2 border-gray-900 pb-6">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                            GADGET STORE
                        </div>
                        <div className="text-gray-600 mb-4">
                            Premium Electronics & Gadgets
                        </div>
                        <div className="text-4xl font-bold text-gray-900">
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
                    <div className="text-center text-gray-600 border-t border-gray-300 pt-6">
                        <p className="font-semibold text-gray-900 mb-2">Thank you for your business!</p>
                        <p className="text-sm">
                            Gadget Store | Lagos, Nigeria | support@gadgetstore.ng | 1-800-GADGETS
                        </p>
                    </div>
                </div>
            </div>

            {/* Print-specific styles */}
            <style jsx global>{`
                @media print {
                    body.printing-invoice * {
                        visibility: hidden;
                    }

                    body.printing-invoice #invoice-content,
                    body.printing-invoice #invoice-content * {
                        visibility: visible;
                    }

                    body.printing-invoice #invoice-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        height: auto !important;
                        padding: 20px !important;
                        margin: 0 !important;
                        max-width: none !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        background: white !important;
                    }

                    .print\\:hidden {
                        display: none !important;
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
            `}</style>
        </div>
    );
};

export default InvoiceView;
