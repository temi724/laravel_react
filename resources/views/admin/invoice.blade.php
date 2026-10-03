<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $sale->order_id }} - {{ config('store.name') }}</title>

    {{-- Styles (Manrope is bundled with the stylesheet) --}}
    @vite(['resources/css/app.css'])
    <style>
        @media print {
            @page { size: A4; margin: 0; }
            .no-print { display: none !important; }
            body { margin: 0; background: #ffffff !important; }
            .invoice-desk { padding: 0 !important; }
            .invoice-sheet { border: none !important; border-radius: 0 !important; }
            .doc { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>

@php
    $orderDetails = is_array($sale->order_details) ? $sale->order_details : [];
    $lines = [];

    if (count($orderDetails) > 0) {
        foreach ($orderDetails as $item) {
            $price = $item['price'] ?? 0;
            $quantity = $item['quantity'] ?? 1;
            $lines[] = [
                'name' => $item['name'] ?? 'Product',
                'options' => array_filter([\App\Helpers\SaleLine::note($item)]),
                'serials' => array_filter([\App\Helpers\SaleLine::serials($item)]),
                'quantity' => $quantity,
                'price' => $price,
                'subtotal' => $item['subtotal'] ?? ($price * $quantity),
            ];
        }
    } else {
        // Fallback: if order_details is empty, try to get products from product_ids
        foreach (is_array($sale->product_ids) ? $sale->product_ids : [] as $productId) {
            $product = \App\Models\Product::find($productId) ?? \App\Models\Deal::find($productId);
            if ($product) {
                $price = $product->display_price ?? $product->price ?? 0;
                // Default quantity since we don't have this info
                $lines[] = ['name' => $product->product_name ?? 'Product', 'options' => [], 'serials' => [], 'quantity' => 1, 'price' => $price, 'subtotal' => $price];
            }
        }
    }

    $subtotal = array_sum(array_column($lines, 'subtotal'));
    $deliveryFee = (float) ($sale->delivery_fee ?? 0);
    $paid = in_array($sale->payment_status, ['completed', 'paid'], true);
    $offline = $sale->sale_type === 'offline';
    $sentence = fn ($value) => ucfirst(str_replace('_', ' ', (string) $value));

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
    $number = $sale->order_id ?: $sale->receipt_number ?: $sale->id;
@endphp

<body class="bg-gray-100 font-sans antialiased">
    <div class="invoice-desk mx-auto max-w-[874px] p-4 sm:p-10">
        {{-- Actions --}}
        <div class="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
            <a href="{{ route('admin.sales') }}" class="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-ink">
                <x-icon name="arrow-left" class="size-4" />
                Back to sales
            </a>
            <div class="flex items-center gap-2">
                <button type="button" onclick="window.print()" class="btn btn-outline">Print</button>
                <a href="{{ route('admin.invoice.pdf', $sale->id) }}" class="btn btn-primary">Save as PDF</a>
            </div>
        </div>

        {{-- The same paper document as the invoice dialog (resources/css/document.css). It scrolls sideways on small screens. --}}
        <div class="overflow-x-auto">
            <div class="invoice-sheet mx-auto w-fit overflow-hidden rounded-lg border border-gray-200">
                <article class="doc">
                    <!-- Header -->
                    <header class="doc-head">
                        <div>
                            <p class="doc-brand-name">{{ config('store.legal_name') }}</p>
                            <p class="doc-brand-meta">
                                {{ config('store.address.line') }}<br>
                                {{ config('store.address.area') }}<br>
                                {{ config('store.phone_display') }}
                            </p>
                        </div>
                        <div class="doc-title">
                            <h1 class="doc-kind">Invoice</h1>
                            <p class="doc-number">{{ $number }}</p>
                            <p class="doc-date">{{ $sale->created_at->format('j F Y') }}</p>
                        </div>
                    </header>

                    <!-- Customer Details -->
                    <section class="doc-meta">
                        <div>
                            <p class="doc-label">Billed to</p>
                            <p class="doc-value">{{ $sale->username }}</p>
                            @foreach($customerLines as $line)
                                <p class="doc-sub">{{ $line }}</p>
                            @endforeach
                        </div>
                        <div>
                            <div class="doc-fact">
                                <p class="doc-label">Order</p>
                                <p class="doc-value">{{ $sale->order_status ? 'Completed' : 'In progress' }}</p>
                            </div>
                            <div class="doc-fact">
                                <p class="doc-label">{{ $offline ? 'Sold' : 'Collection' }}</p>
                                <p class="doc-value">{{ $offline ? 'In store' : $sentence($sale->order_type ?: 'pickup') }}</p>
                            </div>
                        </div>
                        <div>
                            <div class="doc-fact">
                                <p class="doc-label">Payment method</p>
                                <p class="doc-value">{{ $sentence($sale->payment_method ?: 'bank transfer') }}</p>
                            </div>
                            <div class="doc-fact">
                                <p class="doc-label">Status</p>
                                <span class="doc-pill doc-pill-{{ $statusTone }}">{{ $statusLabel }}</span>
                            </div>
                        </div>
                    </section>

                    <!-- Items Table -->
                    <table class="doc-items">
                        <thead>
                            <tr>
                                <th scope="col">Item</th>
                                <th scope="col" class="doc-num">Qty</th>
                                <th scope="col" class="doc-num">Unit price</th>
                                <th scope="col" class="doc-num">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($lines as $line)
                                <tr>
                                    <td>
                                        <p class="doc-item-name">{{ $line['name'] }}</p>
                                        @if(count($line['options']) > 0)
                                            <p class="doc-item-note">{{ implode(', ', $line['options']) }}</p>
                                        @endif
                                        @if(count($line['serials']) > 0)
                                            <p class="doc-item-serial">S/N {{ implode(', ', $line['serials']) }}</p>
                                        @endif
                                    </td>
                                    <td class="doc-num">{{ $line['quantity'] }}</td>
                                    <td class="doc-num">{{ \App\Helpers\Money::naira($line['price']) }}</td>
                                    <td class="doc-num">{{ \App\Helpers\Money::naira($line['subtotal']) }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="4" class="doc-empty">No items on this order</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>

                    <!-- Totals -->
                    <div class="doc-summary">
                        <div class="doc-aside">
                            @unless($paid)
                                <div class="doc-box">
                                    <p class="doc-box-title">Pay by bank transfer</p>
                                    <p class="doc-account">{{ config('store.bank.account_number') }}</p>
                                    <p>{{ config('store.bank.bank_name') }}<br>{{ config('store.bank.account_name') }}</p>
                                </div>
                            @endunless
                            @if($sale->notes)
                                <div class="doc-box">
                                    <p class="doc-box-title">Notes</p>
                                    <p style="white-space: pre-line;">{{ $sale->notes }}</p>
                                </div>
                            @endif
                        </div>

                        <div class="doc-totals">
                            <div class="doc-total-row">
                                <span>Subtotal</span>
                                <span>{{ \App\Helpers\Money::naira($subtotal) }}</span>
                            </div>
                            @if($deliveryFee > 0)
                                <div class="doc-total-row">
                                    <span>Delivery fee</span>
                                    <span>{{ \App\Helpers\Money::naira($deliveryFee) }}</span>
                                </div>
                            @endif
                            <div class="doc-grand">
                                <span>{{ $paid ? 'Total paid' : 'Total due' }}</span>
                                <strong>{{ \App\Helpers\Money::naira($subtotal + $deliveryFee) }}</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="doc-foot-spacer"></div>
                    <footer class="doc-foot">
                        <p class="doc-thanks">Thank you for your business.</p>
                        <p style="text-align: right;">{{ config('store.website') }}<br>{{ config('store.email') }}</p>
                    </footer>
                </article>
            </div>
        </div>
    </div>
</body>
</html>
