<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ $sale->order_id }}</title>
    <style>
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .invoice-info, .customer-info {
            width: 48%;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1f2937;
        }
        .info-item {
            margin-bottom: 5px;
        }
        .label {
            font-weight: bold;
            color: #6b7280;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background-color: #f3f4f6;
            padding: 12px;
            text-align: left;
            border: 1px solid #d1d5db;
            font-weight: bold;
        }
        .items-table td {
            padding: 10px;
            border: 1px solid #d1d5db;
        }
        .total-section {
            text-align: right;
            margin-top: 20px;
        }
        .total-amount {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        .currency {
            font-family: Arial, sans-serif;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="company-name">GADGET STORE</div>
        <div style="color: #6b7280; margin-bottom: 20px;">Premium Electronics & Gadgets</div>
        <div class="invoice-title">INVOICE</div>
    </div>

    <!-- Invoice Details -->
    <div class="invoice-details">
        <div class="invoice-info">
            <div class="section-title">Invoice Information</div>
            <div class="info-item">
                <span class="label">Invoice #:</span> {{ $sale->order_id }}
            </div>
            <div class="info-item">
                <span class="label">Date:</span> {{ $sale->created_at->format('F j, Y') }}
            </div>
            <div class="info-item">
                <span class="label">Status:</span>
                @if($sale->payment_status === 'paid')
                    Paid
                @else
                    {{ ucfirst($sale->payment_status) }}
                @endif
            </div>
        </div>

        <div class="customer-info">
            <div class="section-title">Bill To</div>
            <div class="info-item">
                <span class="label">Name:</span> {{ $sale->username }}
            </div>
            <div class="info-item">
                <span class="label">Email:</span> {{ $sale->emailaddress }}
            </div>
            @if($sale->phonenumber)
            <div class="info-item">
                <span class="label">Phone:</span> {{ $sale->phonenumber }}
            </div>
            @endif
            @if($sale->city || $sale->state)
            <div class="info-item">
                <span class="label">Location:</span>
                {{ $sale->city }}{{ $sale->city && $sale->state ? ', ' : '' }}{{ $sale->state }}
            </div>
            @endif
        </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($orderDetails as $item)
            <tr>
                <td>{{ $item['name'] ?? 'Product' }}</td>
                <td class="currency">&#8358;{{ number_format($item['price'] ?? 0, 2) }}</td>
                <td>{{ $item['quantity'] ?? 1 }}</td>
                <td class="currency">&#8358;{{ number_format($item['subtotal'] ?? 0, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Total -->
    <div class="total-section">
        <div style="border-top: 2px solid #333; padding-top: 15px;">
            <div class="total-amount">
                <span class="label">Total: </span>
                <span class="currency">&#8358;{{ number_format($total, 2) }}</span>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p><strong>Thank you for your business!</strong></p>
        <p>Gadget Store | Lagos, Nigeria | support@gadgetstore.ng | 1-800-GADGETS</p>
    </div>
</body>
</html>
