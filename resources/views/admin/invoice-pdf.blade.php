<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Invoice {{ $sale->order_id }}</title>
    {{--
        This is the DomPDF version of the invoice. It mirrors the on-screen document
        (resources/js/components/admin/documents/SalesDocument.jsx, resources/css/document.css)
        using tables, because DomPDF has no flexbox or grid.
        Manrope has no naira sign, so "₦" is set in DejaVu Sans, which ships with DomPDF.
    --}}
    <style>
        @font-face {
            font-family: 'Manrope';
            font-weight: 400;
            font-style: normal;
            src: url("{{ resource_path('fonts/Manrope-Regular.ttf') }}") format('truetype');
        }
        @font-face {
            font-family: 'Manrope';
            font-weight: 600;
            font-style: normal;
            src: url("{{ resource_path('fonts/Manrope-SemiBold.ttf') }}") format('truetype');
        }
        @font-face {
            font-family: 'Manrope';
            font-weight: 700;
            font-style: normal;
            src: url("{{ resource_path('fonts/Manrope-Bold.ttf') }}") format('truetype');
        }
        @font-face {
            font-family: 'Manrope';
            font-weight: 800;
            font-style: normal;
            src: url("{{ resource_path('fonts/Manrope-ExtraBold.ttf') }}") format('truetype');
        }

        @page {
            size: A4;
            margin: 42pt;
        }

        /* Line heights look small because DomPDF multiplies them by the font's own height, about 1.37 for Manrope */
        body {
            margin: 0;
            color: #14171c;
            font-family: 'Manrope', DejaVu Sans, sans-serif;
            font-size: 10.5pt;
            line-height: 1.1;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        td, th {
            padding: 0;
            vertical-align: top;
            text-align: left;
        }

        /* DejaVu Sans only comes in regular and bold, so the sign names one of the two */
        .naira {
            font-family: DejaVu Sans, sans-serif;
            font-weight: normal;
        }

        .amount .naira {
            font-weight: bold;
        }

        .muted {
            color: #5b6472;
        }

        .right {
            text-align: right;
        }

        /* Header */
        .brand-name {
            font-size: 14.5pt;
            font-weight: 800;
            line-height: 0.88;
        }

        .brand-meta {
            margin-top: 6pt;
            color: #5b6472;
            font-size: 9.75pt;
            line-height: 1.17;
        }

        .kind {
            font-size: 31pt;
            font-weight: 800;
            line-height: 0.73;
        }

        .number {
            margin-top: 11pt;
            font-size: 9.75pt;
            font-weight: 700;
        }

        .date {
            color: #5b6472;
            font-size: 9.75pt;
        }

        /* Customer and order facts */
        .meta {
            margin-top: 30pt;
            border-radius: 12pt;
            background: #f5f6f8;
        }

        .meta td {
            padding: 15pt 18pt;
        }

        .label {
            color: #5b6472;
            font-size: 9pt;
            font-weight: 600;
        }

        .value {
            margin-top: 2pt;
            font-weight: 700;
        }

        .sub {
            color: #5b6472;
            font-size: 9.75pt;
        }

        .fact {
            margin-top: 9pt;
        }

        .pill {
            display: inline-block;
            margin-top: 3pt;
            padding: 3pt 8pt;
            border-radius: 20pt;
            font-size: 9pt;
            font-weight: 700;
            line-height: 0.88;
        }

        .pill-success { background: #ecfdf3; color: #067647; }
        .pill-warning { background: #fffaeb; color: #b54708; }
        .pill-danger { background: #fef3f2; color: #d92d20; }
        .pill-neutral { background: #e5e7eb; color: #14171c; }

        /* Line items */
        .items {
            margin-top: 27pt;
        }

        .items th {
            padding-bottom: 7.5pt;
            border-bottom: 1.1pt solid #14171c;
            color: #5b6472;
            font-size: 9pt;
            font-weight: 600;
        }

        .items td {
            padding: 10.5pt 0;
            border-bottom: 0.75pt solid #e5e7eb;
        }

        .items .num {
            padding-left: 15pt;
            text-align: right;
            white-space: nowrap;
        }

        .item-name {
            font-weight: 700;
        }

        .item-note {
            color: #5b6472;
            font-size: 9pt;
        }

        /* Serial numbers of the units sold */
        .item-serial {
            margin-top: 1.5pt;
            font-size: 9pt;
            font-weight: 600;
        }

        /* Totals on the right, payment details on the left */
        .summary {
            margin-top: 21pt;
        }

        .box {
            padding: 12pt 13.5pt;
            border-radius: 10.5pt;
            background: #f5f6f8;
            font-size: 9.75pt;
        }

        .box-title {
            font-weight: 700;
        }

        .account {
            margin: 4pt 0 3pt;
            font-size: 15.5pt;
            font-weight: 800;
            line-height: 0.88;
        }

        .totals td {
            padding: 3.75pt 0;
        }

        .totals .amount {
            font-weight: 600;
            text-align: right;
        }

        .grand td {
            padding-top: 10.5pt;
            border-top: 1.1pt solid #14171c;
            font-weight: 700;
            vertical-align: bottom;
        }

        .grand .amount {
            font-size: 18.5pt;
            font-weight: 800;
            line-height: 0.8;
        }

        /* Footer, fixed to the bottom of the page */
        .foot {
            position: fixed;
            right: 0;
            bottom: 0;
            left: 0;
            padding-top: 13.5pt;
            border-top: 0.75pt solid #e5e7eb;
            color: #5b6472;
            font-size: 9pt;
        }

        .thanks {
            color: #14171c;
            font-size: 10.5pt;
            font-weight: 700;
        }
    </style>
</head>

@php
    $naira = fn ($amount) => '<span class="naira">&#8358;</span>' . ltrim(\App\Helpers\Money::naira($amount), '₦');
    $sentence = fn ($value) => ucfirst(str_replace('_', ' ', (string) $value));

    $paid = in_array($sale->payment_status, ['completed', 'paid'], true);
    $offline = $sale->sale_type === 'offline';
    $statuses = [
        'completed' => ['Paid', 'success'],
        'paid' => ['Paid', 'success'],
        'pending' => ['Payment pending', 'warning'],
        'failed' => ['Payment failed', 'danger'],
        'refunded' => ['Refunded', 'neutral'],
    ];
    [$statusLabel, $statusTone] = $statuses[$sale->payment_status] ?? [$sentence($sale->payment_status), 'neutral'];

    // In-store sales save "In-Store" as the place; that is not an address worth printing
    $place = implode(', ', array_filter([$sale->city, $sale->state], fn ($part) => $part && $part !== 'In-Store'));
    $address = $sale->order_type === 'delivery' && $sale->location && $sale->location !== 'In-Store' ? $sale->location : $sale->address;
    $customerLines = array_filter([$sale->emailaddress, $sale->phonenumber, $address, $place]);
@endphp

<body>
    <!-- Footer -->
    <div class="foot">
        <table>
            <tr>
                <td class="thanks" style="vertical-align: bottom;">Thank you for your business.</td>
                <td class="right">{{ config('store.website') }}<br>{{ config('store.email') }}</td>
            </tr>
        </table>
    </div>

    <!-- Header -->
    <table>
        <tr>
            <td>
                <div class="brand-name">{{ config('store.legal_name') }}</div>
                <div class="brand-meta">
                    {{ config('store.address.line') }}<br>
                    {{ config('store.address.area') }}<br>
                    {{ config('store.phone_display') }}
                </div>
            </td>
            <td class="right">
                <div class="kind">Invoice</div>
                <div class="number">{{ $sale->order_id ?: $sale->receipt_number ?: $sale->id }}</div>
                <div class="date">{{ $sale->created_at->format('j F Y') }}</div>
            </td>
        </tr>
    </table>

    <!-- Invoice Details -->
    <div class="meta">
        <table>
            <tr>
                <td style="width: 40%;">
                    <div class="label">Billed to</div>
                    <div class="value">{{ $sale->username }}</div>
                    @foreach($customerLines as $line)
                        <div class="sub">{{ $line }}</div>
                    @endforeach
                </td>
                <td style="width: 30%;">
                    <div class="label">Order</div>
                    <div class="value">{{ $sale->order_status ? 'Completed' : 'In progress' }}</div>
                    <div class="fact">
                        <div class="label">{{ $offline ? 'Sold' : 'Collection' }}</div>
                        <div class="value">{{ $offline ? 'In store' : $sentence($sale->order_type ?: 'pickup') }}</div>
                    </div>
                </td>
                <td style="width: 30%;">
                    <div class="label">Payment method</div>
                    <div class="value">{{ $sentence($sale->payment_method ?: 'bank transfer') }}</div>
                    <div class="fact">
                        <div class="label">Status</div>
                        <span class="pill pill-{{ $statusTone }}">{{ $statusLabel }}</span>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Items Table -->
    <table class="items">
        <thead>
            <tr>
                <th>Item</th>
                <th class="num">Qty</th>
                <th class="num">Unit price</th>
                <th class="num">Amount</th>
            </tr>
        </thead>
        <tbody>
            @forelse($orderDetails as $item)
                @php
                    $price = $item['price'] ?? 0;
                    $quantity = $item['quantity'] ?? 1;
                    $note = \App\Helpers\SaleLine::note($item);
                    $serials = \App\Helpers\SaleLine::serials($item);
                @endphp
                <tr>
                    <td>
                        <div class="item-name">{{ $item['name'] ?? 'Product' }}</div>
                        @if($note !== '')
                            <div class="item-note">{{ $note }}</div>
                        @endif
                        @if($serials !== '')
                            <div class="item-serial">S/N {{ $serials }}</div>
                        @endif
                    </td>
                    <td class="num">{{ $quantity }}</td>
                    <td class="num">{!! $naira($price) !!}</td>
                    <td class="num">{!! $naira($item['subtotal'] ?? $price * $quantity) !!}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="muted" style="text-align: center;">No items on this order</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Total -->
    <table class="summary">
        <tr>
            <td style="width: 46%;">
                @unless($paid)
                    <div class="box">
                        <div class="box-title">Pay by bank transfer</div>
                        <div class="account">{{ config('store.bank.account_number') }}</div>
                        <div>{{ config('store.bank.bank_name') }}<br>{{ config('store.bank.account_name') }}</div>
                    </div>
                @endunless
                @if($sale->notes)
                    <div class="box" @unless($paid) style="margin-top: 9pt;" @endunless>
                        <div class="box-title">Notes</div>
                        <div>{!! nl2br(e($sale->notes)) !!}</div>
                    </div>
                @endif
            </td>
            <td style="width: 14%;"></td>
            <td style="width: 40%;">
                <table class="totals">
                    <tr>
                        <td class="muted">Subtotal</td>
                        <td class="amount">{!! $naira($total) !!}</td>
                    </tr>
                    <tr class="grand">
                        <td style="padding-top: 12pt;">{{ $paid ? 'Total paid' : 'Total due' }}</td>
                        <td class="amount">{!! $naira($total) !!}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
