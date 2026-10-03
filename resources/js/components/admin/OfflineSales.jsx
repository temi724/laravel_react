import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { Add, DocumentDownload, Trash } from 'iconsax-react';
import { Button, Card, EmptyState, Field, IconButton, Input, SectionHeader, Select, Textarea } from './ui';
import { formatLongDate, formatPrice, itemSerials, parseOrderDetails, sanitizePhone, today } from '../../lib/admin';
import DocumentDesk from './documents/DocumentDesk';
import SalesDocument from './documents/SalesDocument';
import ProductPicker from './ProductPicker';
import { downloadDocumentPdf } from '../../lib/pdf';
import { showToast } from '../../lib/toast';

const PAYMENT_LABELS = {
    cash: 'Cash',
    card: 'Card',
    bank_transfer: 'Bank transfer',
    check: 'Cheque',
    other: 'Other'
};

// Generate receipt number
const generateReceiptNumber = () => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    return `RCP-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${timestamp}`;
};

const OfflineSales = () => {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [receiptNumber, setReceiptNumber] = useState(() => generateReceiptNumber());
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
        date: today(),
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
                    description: '',
                    // Set when the item is picked from the product list. Stock and serial numbers
                    // then come from that product; an item typed in by hand has none.
                    productId: null,
                    stock: null,
                    shelfSerials: [],
                    soldSerials: null // what the server took from stock, known once the sale is saved
                }
            ]
        }));
    };

    // Pick a product from the list: its name, price, stock and serial numbers come with it
    const pickProduct = (itemId, product) => {
        setReceiptData(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === itemId
                    ? {
                        ...item,
                        name: product.product_name,
                        price: Number(product.display_price ?? product.price) || 0,
                        quantity: Math.min(Math.max(1, item.quantity), Number(product.stock_quantity) || 1),
                        productId: product.id,
                        stock: Number(product.stock_quantity) || 0,
                        shelfSerials: Array.isArray(product.serial_numbers) ? product.serial_numbers : []
                    }
                    : item
            )
        }));
    };

    // Typing a different name means it is no longer that product
    const renameItem = (itemId, name) => {
        setReceiptData(prev => ({
            ...prev,
            items: prev.items.map(item => (item.id === itemId ? { ...item, name, productId: null, stock: null, shelfSerials: [] } : item))
        }));
    };

    // The serial numbers the receipt shows: the ones the server took, or until then the next ones on the shelf
    const serialsOf = (item) => item.soldSerials ?? (item.shelfSerials || []).slice(0, Math.max(1, Number(item.quantity) || 1));

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

    // Save the sale, then download its receipt as a PDF
    const generatePDFReceipt = async () => {
        if (isGeneratingPdf) return;

        // Validate form
        if (receiptData.items.length === 0) {
            showToast('Add at least one item first', 'error');
            return;
        }

        if (!receiptData.customer.name.trim()) {
            showToast('Enter the customer name first', 'error');
            return;
        }

        const short = receiptData.items.find(item => item.productId && item.quantity > item.stock);
        if (short) {
            showToast(`Only ${short.stock} of ${short.name} in stock`, 'error');
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
                    description: item.description || '',
                    product_id: item.productId
                })),
                paymentMethod: receiptData.paymentMethod,
                deliveryOption: receiptData.deliveryOption,
                notes: receiptData.notes || '',
                date: receiptData.date,
                receipt_number: receiptNumber,
                total: calculateTotal(),
                grand_total: calculateTotal(),
                amount_paid: parseFloat(receiptData.amountPaid) || calculateTotal(),
                change: parseFloat(receiptData.change) || 0,
                sale_type: 'offline'
            };

            // Save the sale to database first. saveOfflineSale tells the user if it fails.
            const saved = await saveOfflineSale(saleData);
            if (!saved) return;

            // Put the serial numbers that really left stock on the receipt before it is drawn
            const savedLines = parseOrderDetails(saved.order_details);
            flushSync(() => {
                setReceiptData(prev => ({
                    ...prev,
                    items: prev.items.map((item, index) => ({ ...item, soldSerials: savedLines[index] ? itemSerials(savedLines[index]) : [] }))
                }));
            });

            await downloadDocumentPdf(document.getElementById('receipt-content'), `receipt-${saleData.receipt_number}.pdf`);
            showToast('Sale saved and receipt downloaded');

            // Clear the form after successful generation
            clearForm();
        } catch (error) {
            console.error('Error generating PDF:', error.message || error);
            showToast('The sale was saved, but the receipt could not be created. Try again.', 'error');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Save offline sale to database. Resolves to the saved sale, or null if it could not be saved.
    const saveOfflineSale = async (saleData) => {
        try {
            const response = await fetch('/api/admin/offline-sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify(saleData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                return result.order || {};
            } else {
                console.error('Failed to save offline sale:', result);
                let errorMessage = result.message || 'Unknown error';

                // If there are validation errors, show the first one in plain words
                if (result.errors) {
                    errorMessage = Object.values(result.errors).flat()[0] || errorMessage;
                }

                showToast(`Could not save the sale. ${errorMessage}`, 'error');
                return null;
            }
        } catch (error) {
            console.error('Error saving offline sale:', error);
            showToast('Could not save the sale. Check your connection and try again.', 'error');
            return null;
        }
    };

    // Clear form
    const clearForm = () => {
        setReceiptNumber(generateReceiptNumber());
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
            date: today(),
            amountPaid: 0,
            change: 0
        });
    };

    const total = calculateTotal();
    const canGenerate = receiptData.items.length > 0 && !isGeneratingPdf;

    return (
        <div className="space-y-4">
            <SectionHeader
                title="Record an in-store sale"
                description="Saves the sale and downloads a PDF receipt for the customer."
                actions={
                    <>
                        <Button variant="secondary" onClick={clearForm}>
                            Clear form
                        </Button>
                        <Button icon={DocumentDownload} loading={isGeneratingPdf} disabled={!canGenerate} onClick={generatePDFReceipt}>
                            {isGeneratingPdf ? 'Creating receipt' : 'Save and download receipt'}
                        </Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Customer Information */}
                <Card>
                    <SectionHeader as="h3" title="Customer" />
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Customer name" required>
                            <Input value={receiptData.customer.name} onChange={(e) => updateCustomer('name', e.target.value)} autoComplete="off" />
                        </Field>
                        <Field label="Phone" optional>
                            <Input type="tel" inputMode="tel" value={receiptData.customer.phone} onChange={(e) => updateCustomer('phone', sanitizePhone(e.target.value))} placeholder="08030000000" autoComplete="off" />
                        </Field>
                        <Field label="Email" optional>
                            <Input type="email" value={receiptData.customer.email} onChange={(e) => updateCustomer('email', e.target.value)} placeholder="customer@example.com" autoComplete="off" />
                        </Field>
                        <Field label="Sale date">
                            <Input type="date" value={receiptData.date} max={today()} onChange={(e) => setReceiptData(prev => ({ ...prev, date: e.target.value }))} />
                        </Field>
                        <Field label="Address" optional className="md:col-span-2">
                            <Textarea rows={2} value={receiptData.customer.address} onChange={(e) => updateCustomer('address', e.target.value)} />
                        </Field>
                    </div>
                </Card>

                {/* Payment & Notes */}
                <Card>
                    <SectionHeader as="h3" title="Payment" />
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Payment method">
                            <Select value={receiptData.paymentMethod} onChange={(e) => setReceiptData(prev => ({ ...prev, paymentMethod: e.target.value }))}>
                                <option value="cash">Cash</option>
                                <option value="card">Credit/Debit Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="check">Check</option>
                                <option value="other">Other</option>
                            </Select>
                        </Field>
                        <Field label="Pickup or delivery">
                            <Select value={receiptData.deliveryOption} onChange={(e) => setReceiptData(prev => ({ ...prev, deliveryOption: e.target.value }))}>
                                <option value="pickup">Pickup</option>
                                <option value="delivery">Delivery</option>
                            </Select>
                        </Field>
                        <Field label="Amount paid" hint={receiptData.change > 0 ? `Change to give back: ${formatPrice(receiptData.change)}` : `Sale total: ${formatPrice(total)}`}>
                            <Input type="number" inputMode="decimal" min="0" step="0.01" prefix="₦" value={receiptData.amountPaid} onChange={(e) => updateAmountPaid(e.target.value)} />
                        </Field>
                        <Field label="Notes" optional className="md:col-span-2">
                            <Textarea rows={2} value={receiptData.notes} onChange={(e) => setReceiptData(prev => ({ ...prev, notes: e.target.value }))} />
                        </Field>
                    </div>
                </Card>
            </div>

            {/* Items Section */}
            <Card>
                <SectionHeader
                    as="h3"
                    title="Items"
                    actions={
                        <Button variant="secondary" size="sm" icon={Add} onClick={addItem}>
                            Add item
                        </Button>
                    }
                />

                {receiptData.items.length === 0 ? (
                    <EmptyState
                        className="py-8"
                        title="No items yet"
                        description="Add each product the customer is buying."
                        action={
                            <Button icon={Add} onClick={addItem}>
                                Add item
                            </Button>
                        }
                    />
                ) : (
                    <div className="mt-4 space-y-3">
                        {receiptData.items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-2 items-end gap-3 rounded-2xl bg-gray-50 p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_5rem_9rem_auto_auto]">
                                <Field label="Product name" className="col-span-2 md:col-span-1">
                                    <ProductPicker size="sm" value={item.name} onChange={(name) => renameItem(item.id, name)} onPick={(product) => pickProduct(item.id, product)} />
                                </Field>
                                <Field label="Description" optional className="col-span-2 md:col-span-1">
                                    <Input size="sm" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} />
                                </Field>
                                <Field label="Qty">
                                    <Input size="sm" type="number" inputMode="numeric" min="1" max={item.productId ? item.stock : undefined} value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} />
                                </Field>
                                <Field label="Price">
                                    <Input size="sm" type="number" inputMode="decimal" min="0" step="0.01" prefix="₦" value={item.price} onChange={(e) => updateItem(item.id, 'price', e.target.value)} />
                                </Field>
                                <div className="pb-2 text-right">
                                    <p className="text-xs text-gray-500">Subtotal</p>
                                    <p className="font-bold tabular-nums">{formatPrice(item.quantity * item.price)}</p>
                                </div>
                                <IconButton icon={Trash} tone="danger" label={`Remove item ${index + 1}`} onClick={() => removeItem(item.id)} className="mb-0.5 justify-self-end" />

                                {/* Where this line's stock and serial numbers come from */}
                                {item.name.trim() !== '' && (
                                    <p className={`col-span-full text-xs ${item.productId && item.quantity > item.stock ? 'font-semibold text-sale' : 'text-gray-600'}`}>
                                        {item.productId
                                            ? item.quantity > item.stock
                                                ? `Only ${item.stock} in stock.`
                                                : `From the product list: ${item.stock} in stock. ${
                                                      serialsOf(item).length > 0
                                                          ? `Serial ${serialsOf(item).length === 1 ? 'number' : 'numbers'} ${serialsOf(item).join(', ')} will be on the receipt.`
                                                          : 'This product has no serial numbers listed.'
                                                  }`
                                            : 'Not from the product list, so stock will not change and no serial number is added. Pick a suggestion to link it.'}
                                    </p>
                                )}
                            </div>
                        ))}

                        <div className="flex items-baseline justify-end gap-4 pt-2">
                            <span className="text-sm font-bold">Total</span>
                            <span className="text-2xl font-extrabold tracking-tight tabular-nums">{formatPrice(total)}</span>
                        </div>
                    </div>
                )}
            </Card>

            {/* Receipt Preview */}
            <Card>
                <SectionHeader as="h3" title="Receipt preview" description="This is the document the customer receives. It updates as you type." />

                {/* The page, on a grey desk */}
                <DocumentDesk className="mt-4 rounded-2xl">
                    <SalesDocument
                        id="receipt-content"
                        kind="Receipt"
                        number={receiptNumber}
                        date={formatLongDate(receiptData.date)}
                        status={{ label: 'Paid', tone: 'success' }}
                        customer={{
                            name: receiptData.customer.name,
                            lines: [receiptData.customer.email, receiptData.customer.phone, receiptData.customer.address]
                        }}
                        facts={[
                            { label: 'Payment method', value: PAYMENT_LABELS[receiptData.paymentMethod] || receiptData.paymentMethod },
                            { label: 'Collection', value: receiptData.deliveryOption === 'delivery' ? 'Delivery' : 'Pickup' }
                        ]}
                        items={receiptData.items.map(item => ({
                            name: item.name,
                            note: item.description,
                            serials: serialsOf(item),
                            quantity: item.quantity,
                            price: item.price,
                            subtotal: item.quantity * item.price
                        }))}
                        totals={[
                            { label: 'Subtotal', value: total },
                            { label: 'Amount paid', value: Number(receiptData.amountPaid) || total },
                            ...(receiptData.change > 0 ? [{ label: 'Change', value: receiptData.change }] : [])
                        ]}
                        total={total}
                        notes={receiptData.notes}
                    />
                </DocumentDesk>
            </Card>
        </div>
    );
};

export default OfflineSales;
