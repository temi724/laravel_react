import React, { useState, useEffect } from 'react';

const OfflineSales = () => {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [products, setProducts] = useState([]);
    const [receiptData, setReceiptData] = useState({
        customer: {
            name: '',
            email: '',
            phone: '',
            address: ''
        },
        items: [],
        paymentMethod: 'cash',
        deliveryOption: 'pickup', // Default to pickup for offline sales
        notes: '',
        date: new Date().toISOString().split('T')[0],
        amountPaid: 0,
        change: 0
    });

    // Add new item to the receipt
    const addItem = () => {
        setReceiptData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    id: Date.now(),
                    name: '',
                    quantity: 1,
                    price: 0,
                    description: ''
                }
            ]
        }));
    };

    // Remove item from receipt
    const removeItem = (itemId) => {
        setReceiptData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== itemId)
        }));
    };

    // Update item in receipt
    const updateItem = (itemId, field, value) => {
        setReceiptData(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === itemId
                    ? { ...item, [field]: field === 'quantity' || field === 'price' ? Number(value) : value }
                    : item
            )
        }));
    };

    // Update customer info
    const updateCustomer = (field, value) => {
        setReceiptData(prev => ({
            ...prev,
            customer: {
                ...prev.customer,
                [field]: value
            }
        }));
    };

    // Calculate total
    const calculateTotal = () => {
        return receiptData.items.reduce((total, item) => {
            return total + (item.quantity * item.price);
        }, 0);
    };

    // Calculate grand total (no tax for receipts)
    const calculateGrandTotal = () => {
        return calculateTotal();
    };

    // Update amount paid and calculate change
    const updateAmountPaid = (amount) => {
        const amountPaid = Number(amount);
        const total = calculateTotal();
        const change = Math.max(0, amountPaid - total);

        setReceiptData(prev => ({
            ...prev,
            amountPaid: amountPaid,
            change: change
        }));
    };

    // Generate receipt number
    const generateReceiptNumber = () => {
        const now = new Date();
        const timestamp = now.getTime().toString().slice(-6);
        return `RCP-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${timestamp}`;
    };

    // Load html2pdf library dynamically
    const loadHtml2Pdf = async () => {
        try {
            const html2pdfModule = await import('html2pdf.js');
            return html2pdfModule.default || html2pdfModule;
        } catch (error) {
            console.error('Failed to load html2pdf:', error);
            throw error;
        }
    };

    // Generate and download PDF receipt (using same method as invoice)
    const generatePDFReceipt = async () => {
        if (isGeneratingPdf) return;

        // Validate form
        if (receiptData.items.length === 0) {
            alert('Please add at least one item to generate a receipt.');
            return;
        }

        if (!receiptData.customer.name.trim()) {
            alert('Please enter customer name.');
            return;
        }

        try {
            setIsGeneratingPdf(true);

            // Prepare sale data for API
            const saleData = {
                customer: {
                    name: receiptData.customer.name,
                    email: receiptData.customer.email || '',
                    phone: receiptData.customer.phone || '',
                    address: receiptData.customer.address || ''
                },
                items: receiptData.items.map(item => ({
                    name: item.name,
                    quantity: parseInt(item.quantity),
                    price: parseFloat(item.price),
                    subtotal: parseInt(item.quantity) * parseFloat(item.price),
                    description: item.description || ''
                })),
                paymentMethod: receiptData.paymentMethod,
                deliveryOption: receiptData.deliveryOption,
                notes: receiptData.notes || '',
                date: receiptData.date,
                receipt_number: generateReceiptNumber(),
                total: calculateTotal(),
                grand_total: calculateTotal(),
                amount_paid: parseFloat(receiptData.amountPaid) || calculateTotal(),
                change: parseFloat(receiptData.change) || 0,
                sale_type: 'offline'
            };

            // Save the sale to database first
            const saved = await saveOfflineSale(saleData);
            if (!saved) {
                alert('Failed to save sale to database. PDF generation cancelled.');
                return;
            }

            // Load html2pdf library
            let html2pdf;
            try {
                html2pdf = await loadHtml2Pdf();

                if (!html2pdf || typeof html2pdf !== 'function') {
                    throw new Error('html2pdf library failed to load properly');
                }

                console.log('html2pdf loaded successfully:', typeof html2pdf);
            } catch (importError) {
                console.error('Failed to import html2pdf:', importError);
                alert('Failed to load PDF library. Please refresh the page and try again.');
                return;
            }

            // Get the receipt element
            const originalReceipt = document.getElementById('receipt-content');
            if (!originalReceipt) {
                console.error('Receipt element not found');
                alert('Cannot generate PDF: Receipt content not found');
                return;
            }

            // Create comprehensive style override to eliminate oklch colors (same as invoice)
            const styleOverrideId = 'pdf-generation-override';
            let existingStyleOverride = document.getElementById(styleOverrideId);
            if (existingStyleOverride) {
                existingStyleOverride.remove();
            }

            const styleOverride = document.createElement('style');
            styleOverride.id = styleOverrideId;
            styleOverride.textContent = `
                /* Force all colors to safe RGB values during PDF generation - exactly like invoice */
                body.printing-receipt #receipt-content,
                body.printing-receipt #receipt-content * {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    border-color: #000000 !important;
                    font-family: Arial, sans-serif !important;
                    box-shadow: none !important;
                    outline: none !important;
                    text-shadow: none !important;
                }

                body.printing-receipt #receipt-content table {
                    border-collapse: collapse !important;
                    width: 100% !important;
                }

                body.printing-receipt #receipt-content th {
                    background-color: #f0f0f0 !important;
                    color: #000000 !important;
                    font-weight: bold !important;
                    border: 1px solid #000000 !important;
                    padding: 12px 8px !important;
                }

                body.printing-receipt #receipt-content td {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    border: 1px solid #000000 !important;
                    padding: 12px 8px !important;
                }

                body.printing-receipt #receipt-content img {
                    max-width: 80px !important;
                    height: auto !important;
                    border: none !important;
                }

                /* Override any Tailwind or CSS custom properties */
                body.printing-receipt #receipt-content * {
                    --tw-bg-opacity: 1 !important;
                    --tw-text-opacity: 1 !important;
                    --tw-border-opacity: 1 !important;
                }
            `;

            document.head.appendChild(styleOverride);

            // Use the original receipt element
            const receiptElement = originalReceipt;

            // Add body class for styling context
            document.body.classList.add('printing-receipt');

            // Configure html2pdf options (exactly like invoice)
            const opt = {
                margin: [0.5, 0.5, 0.5, 0.5],
                filename: `receipt-${saleData.receipt_number}.pdf`,
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
                    height: receiptElement.offsetHeight || 1000,
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

            // Generate PDF directly from the original element with our body class applied
            await html2pdf().set(opt).from(receiptElement).save();

            console.log('Receipt PDF generated successfully!');
            alert('Receipt downloaded successfully! Sale has been saved to the database.');

            // Clear the form after successful generation
            clearForm();

        } catch (error) {
            console.error('Error generating PDF:', error.message || error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                saleData: saleData
            });
            alert('Error generating PDF. Please check the console for details.');
        } finally {
            // Clean up
            setIsGeneratingPdf(false);
            document.body.classList.remove('printing-receipt');
            const styleElement = document.getElementById('pdf-generation-override');
            if (styleElement) {
                styleElement.remove();
            }
        }
    };

    // Save offline sale to database
    const saveOfflineSale = async (saleData) => {
        try {
            console.log('Sending sale data to API:', saleData);

            const response = await fetch('/api/admin/offline-sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify(saleData)
            });

            const result = await response.json();
            console.log('API Response:', result);

            if (response.ok && result.success) {
                console.log('Offline sale saved successfully:', result.data);
                return true;
            } else {
                console.error('Failed to save offline sale:', result);
                let errorMessage = result.message || 'Unknown error';

                // If there are validation errors, format them nicely
                if (result.errors) {
                    const errorDetails = Object.entries(result.errors)
                        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                        .join('\n');
                    errorMessage = `Validation errors:\n${errorDetails}`;
                }

                alert(`Failed to save sale: ${errorMessage}`);
                return false;
            }
        } catch (error) {
            console.error('Error saving offline sale:', error);
            alert('Error saving sale to database. Please check your connection and try again.');
            return false;
        }
    };

    // Clear form
    const clearForm = () => {
        setReceiptData({
            customer: {
                name: '',
                email: '',
                phone: '',
                address: ''
            },
            items: [],
            paymentMethod: 'cash',
            deliveryOption: 'pickup',
            notes: '',
            date: new Date().toISOString().split('T')[0],
            amountPaid: 0,
            change: 0
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Offline Sales</h1>
                <p className="text-gray-600">Create receipts for in-store sales and generate PDF receipts for customers.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Name *
                                </label>
                                <input
                                    type="text"
                                    value={receiptData.customer.name}
                                    onChange={(e) => updateCustomer('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter customer name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={receiptData.customer.email}
                                    onChange={(e) => updateCustomer('email', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="customer@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={receiptData.customer.phone}
                                    onChange={(e) => updateCustomer('phone', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sale Date
                                </label>
                                <input
                                    type="date"
                                    value={receiptData.date}
                                    onChange={(e) => setReceiptData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <textarea
                                value={receiptData.customer.address}
                                onChange={(e) => updateCustomer('address', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="2"
                                placeholder="Customer address (optional)"
                            />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                            <button
                                onClick={addItem}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Add Item
                            </button>
                        </div>

                        {receiptData.items.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No items added yet. Click "Add Item" to get started.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {receiptData.items.map((item) => (
                                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Product Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Product name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Quantity
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    min="1"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Price (₦)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-between items-center">
                                            <div className="flex-1 mr-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Description (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Product description"
                                                />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-600">Subtotal</div>
                                                <div className="text-lg font-semibold text-gray-900">
                                                    ₦{(item.quantity * item.price).toFixed(2)}
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="mt-2 text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment & Notes */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment & Notes</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={receiptData.paymentMethod}
                                    onChange={(e) => setReceiptData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Credit/Debit Card</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="check">Check</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivery Option
                                </label>
                                <select
                                    value={receiptData.deliveryOption}
                                    onChange={(e) => setReceiptData(prev => ({ ...prev, deliveryOption: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="pickup">Pickup</option>
                                    <option value="delivery">Delivery</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount Paid (₦)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={receiptData.amountPaid}
                                    onChange={(e) => updateAmountPaid(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter amount paid"
                                />
                                {receiptData.change > 0 && (
                                    <div className="mt-2 text-sm text-green-600 font-medium">
                                        Change: ₦{receiptData.change.toFixed(2)}
                                    </div>
                                )}
                                <div className="mt-1 text-sm text-gray-500">
                                    Total: ₦{calculateTotal().toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={receiptData.notes}
                                    onChange={(e) => setReceiptData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Additional notes (optional)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex space-x-4">
                            <button
                                onClick={generatePDFReceipt}
                                disabled={isGeneratingPdf || receiptData.items.length === 0}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                            >
                                {isGeneratingPdf ? 'Generating PDF...' : 'Generate Receipt'}
                            </button>
                            <button
                                onClick={clearForm}
                                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                Clear Form
                            </button>
                        </div>
                    </div>
                </div>

                {/* Receipt Preview */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Receipt Preview</h2>

                    {/* Receipt Container with proper scrolling */}
                    <div className="overflow-x-auto">
                        {/* Receipt Content for PDF - Using same structure as invoice */}
                        <div
                            id="receipt-content"
                            className="p-8 print:p-6 bg-white"
                            style={{
                                minHeight: '800px',
                                width: '800px',
                                margin: '0 auto',
                                backgroundColor: '#ffffff',
                                border: 'none',
                                boxShadow: 'none'
                            }}
                        >
                        {/* Store Header - Company Header like invoice */}
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
                                RECEIPT
                            </div>
                        </div>

                        {/* Receipt Details Grid - like invoice */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Receipt Information */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                                    Receipt Information
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex">
                                        <span className="font-medium text-gray-700 w-20">Receipt #:</span>
                                        <span className="text-gray-900">{generateReceiptNumber()}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium text-gray-700 w-20">Date:</span>
                                        <span className="text-gray-900">{receiptData.date}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium text-gray-700 w-20">Payment:</span>
                                        <span className="text-gray-900 capitalize">{receiptData.paymentMethod}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-medium text-gray-700 w-20">Type:</span>
                                        <span className="text-gray-900 capitalize">{receiptData.deliveryOption}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Information */}
                            {receiptData.customer.name && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                                        Customer
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex">
                                            <span className="font-medium text-gray-700 w-16">Name:</span>
                                            <span className="text-gray-900">{receiptData.customer.name}</span>
                                        </div>
                                        {receiptData.customer.email && (
                                            <div className="flex">
                                                <span className="font-medium text-gray-700 w-16">Email:</span>
                                                <span className="text-gray-900">{receiptData.customer.email}</span>
                                            </div>
                                        )}
                                        {receiptData.customer.phone && (
                                            <div className="flex">
                                                <span className="font-medium text-gray-700 w-16">Phone:</span>
                                                <span className="text-gray-900">{receiptData.customer.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Items Table - like invoice */}
                        {receiptData.items.length > 0 && (
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
                                        {receiptData.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-4 py-3 text-gray-900">
                                                    <div className="font-medium">{item.name}</div>
                                                    {item.description && (
                                                        <div className="text-sm text-gray-500 italic">{item.description}</div>
                                                    )}
                                                </td>
                                                <td className="border border-gray-300 px-4 py-3 text-right text-gray-900">
                                                    ₦{item.price.toFixed(2)}
                                                </td>
                                                <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">
                                                    {item.quantity}
                                                </td>
                                                <td className="border border-gray-300 px-4 py-3 text-right text-gray-900 font-medium">
                                                    ₦{(item.quantity * item.price).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Totals - like invoice */}
                        {receiptData.items.length > 0 && (
                            <div className="border-t-2 border-gray-900 pt-4">
                                <div className="flex justify-end">
                                    <div className="w-80">
                                        <div className="bg-gray-50 p-6 border border-gray-300">
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-lg font-semibold text-gray-900">
                                                    <span>Total:</span>
                                                    <span>₦{calculateTotal().toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-base text-gray-700">
                                                    <span>Amount Paid:</span>
                                                    <span>₦{receiptData.amountPaid?.toFixed(2) || '0.00'}</span>
                                                </div>
                                                {receiptData.change > 0 && (
                                                    <div className="flex justify-between text-base text-gray-700 border-t border-gray-300 pt-3">
                                                        <span>Change:</span>
                                                        <span>₦{receiptData.change.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {receiptData.notes && (
                            <div className="border-t border-gray-300 pt-3 mb-4">
                                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Notes:</h4>
                                <div className="text-xs text-gray-700">{receiptData.notes}</div>
                            </div>
                        )}

                        {/* Footer - like invoice */}
                        <div className="border-t border-gray-300 pt-6 mt-8">
                            <div className="text-center space-y-2">
                                <p className="font-semibold text-gray-900 text-base">Thank you for your business!</p>
                                <p className="text-sm text-gray-600">
                                    Your trusted partner in technology solutions
                                </p>
                                <p className="text-sm text-gray-600">
                                    Visit us at murphylog.com.ng
                                </p>
                                <div className="text-xs text-gray-500 mt-4 pt-2 border-t border-gray-200">
                                    Receipt generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfflineSales;
