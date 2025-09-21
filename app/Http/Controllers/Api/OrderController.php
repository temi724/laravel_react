<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sales;
use App\Models\Product;
use App\Models\Deal;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function place(Request $request)
    {
        // Log the incoming request for debugging
        Log::info('Order placement request received:', $request->all());

        try {
            // Handle both new format (with customer data) and old format (direct array)
            $data = $request->isJson() ? $request->json()->all() : $request->all();
            $items = [];
            $customerData = [];
            $orderInfo = [];

            // Check if this is the new format with customer data
            if (isset($data['cartItems']) && isset($data['username'])) {
                // New format: complete order object
                $items = $data['cartItems'];
                $customerData = [
                    'username' => $data['username'] ?? 'Test Customer',
                    'email' => $data['email'] ?? 'test@murphylog.com.ng',
                    'phone' => $data['phone'] ?? '+2348012345678',
                    'delivery_option' => $data['deliveryOption'] ?? 'pickup',
                    'location' => $data['deliveryAddress'] ?? 'Pickup from Store',
                    'city' => $data['city'] ?? 'Lagos',
                    'state' => $data['state'] ?? 'Lagos',
                    'payment_method' => $data['paymentMethod'] ?? 'bank_transfer',
                ];
                $orderInfo = [
                    'total' => $data['cartTotal'] ?? 0,
                    'provided_order_id' => $data['orderId'] ?? null
                ];
            } elseif (is_array($data) && isset($data[0]) && isset($data[0]['id'])) {
                // Old format: direct array of items
                $items = $data;
                $customerData = [
                    'username' => $request->input('customer.name', $request->input('username', 'Test Customer')),
                    'email' => $request->input('customer.email', $request->input('email', 'test@murphylog.com.ng')),
                    'phone' => $request->input('customer.phone', $request->input('phone', '+2348012345678')),
                    'delivery_option' => $request->input('delivery_option', $request->input('deliveryOption', 'pickup')),
                    'location' => $request->input('shipping.address', $request->input('location', 'Pickup from Store')),
                    'city' => $request->input('shipping.city', $request->input('city', 'Lagos')),
                    'state' => $request->input('shipping.state', $request->input('state', 'Lagos')),
                    'payment_method' => $request->input('payment_method', $request->input('paymentMethod', 'bank_transfer')),
                ];
                $orderInfo = ['total' => 0, 'provided_order_id' => null];
            } else {
                // Check for items in different keys
                $items = $data['items'] ?? $data['cartItems'] ?? [];
                $customerData = [
                    'username' => $data['username'] ?? 'Test Customer',
                    'email' => $data['email'] ?? 'test@murphylog.com.ng',
                    'phone' => $data['phone'] ?? '+2348012345678',
                    'delivery_option' => $data['deliveryOption'] ?? 'pickup',
                    'location' => $data['deliveryAddress'] ?? 'Pickup from Store',
                    'city' => $data['city'] ?? 'Lagos',
                    'state' => $data['state'] ?? 'Lagos',
                    'payment_method' => $data['paymentMethod'] ?? 'bank_transfer',
                ];
                $orderInfo = ['total' => $data['cartTotal'] ?? 0, 'provided_order_id' => $data['orderId'] ?? null];
            }

            // Validate we have items
            if (empty($items)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No items found in request',
                    'debug' => [
                        'request_all' => $request->all(),
                        'is_json' => $request->isJson(),
                        'content_type' => $request->header('Content-Type'),
                        'data_keys' => array_keys($data)
                    ]
                ], 400);
            }

            // Basic validation for items
            foreach ($items as $index => $item) {
                if (!isset($item['id']) || !isset($item['name']) || !isset($item['price']) || !isset($item['quantity'])) {
                    return response()->json([
                        'success' => false,
                        'message' => "Invalid item at index {$index}. Missing required fields.",
                        'required_fields' => ['id', 'name', 'price', 'quantity'],
                        'received_item' => $item
                    ], 400);
                }
            }

            // Calculate total from items (verify against provided total if available)
            $calculatedTotal = 0;
            foreach ($items as $item) {
                $itemPrice = is_string($item['price']) ? (float) $item['price'] : $item['price'];
                $quantity = $item['quantity'];
                $calculatedTotal += $itemPrice * $quantity;
            }

            // Use provided total if available and matches calculated, otherwise use calculated
            $finalTotal = $calculatedTotal;
            if ($orderInfo['total'] > 0) {
                // Allow for small floating point differences
                if (abs($orderInfo['total'] - $calculatedTotal) < 1) {
                    $finalTotal = $orderInfo['total'];
                } else {
                    Log::warning('Order total mismatch', [
                        'provided_total' => $orderInfo['total'],
                        'calculated_total' => $calculatedTotal,
                        'using_calculated' => true
                    ]);
                }
            }

            // Generate unique order ID (use provided if available, otherwise generate)
            if ($orderInfo['provided_order_id']) {
                $orderId = $orderInfo['provided_order_id'];
                // Check if this order ID already exists
                if (Sales::where('order_id', $orderId)->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Order ID already exists',
                        'orderId' => $orderId
                    ], 409);
                }
            } else {
                $orderId = 'ORD-' . strtoupper(Str::random(8)) . '-' . time();
                // Check if order ID already exists
                while (Sales::where('order_id', $orderId)->exists()) {
                    $orderId = 'ORD-' . strtoupper(Str::random(8)) . '-' . time();
                }
            }

            // Prepare order items data
            $productIds = [];
            $totalQuantity = 0;
            $orderDetails = [];

            foreach ($items as $item) {
                $productIds[] = $item['id'];
                $totalQuantity += $item['quantity'];

                // Build detailed order information
                $itemDetails = [
                    'id' => $item['id'],
                    'type' => $item['type'] ?? 'product',
                    'name' => $item['name'],
                    'price' => $item['price'],
                    'quantity' => $item['quantity'],
                    'subtotal' => $item['subtotal'] ?? ($item['price'] * $item['quantity']),
                    'image' => $item['image'] ?? null
                ];

                // Add storage and color selections if available
                if (!empty($item['selected_storage'])) {
                    $itemDetails['selected_storage'] = $item['selected_storage'];
                }
                if (!empty($item['storage_price'])) {
                    $itemDetails['storage_price'] = $item['storage_price'];
                }
                if (!empty($item['selected_color'])) {
                    $itemDetails['selected_color'] = $item['selected_color'];
                }

                $orderDetails[] = $itemDetails;
            }

            // Create order record
            $order = Sales::create([
                'order_id' => $orderId,
                'username' => $customerData['username'],
                'emailaddress' => $customerData['email'],
                'phonenumber' => $customerData['phone'],
                'location' => $customerData['delivery_option'] === 'delivery'
                    ? $customerData['location']
                    : 'Pickup from Store - Murphy Log Computers',
                'state' => $customerData['state'],
                'city' => $customerData['city'],
                'product_ids' => $productIds,
                'quantity' => $totalQuantity,
                'order_status' => false, // Not completed yet
                'order_type' => $customerData['delivery_option'],
                'payment_status' => Sales::PAYMENT_PENDING,
                'order_details' => $orderDetails,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Log::info('Order placed successfully', [
                'order_id' => $orderId,
                'customer' => $customerData['username'],
                'total' => $calculatedTotal,
                'items_count' => count($orderDetails)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully!',
                'orderId' => $orderId,
                'order' => [
                    'id' => $orderId,
                    'total' => $finalTotal,
                    'items' => $orderDetails,
                    'customer' => $customerData,
                    'status' => 'pending',
                    'created_at' => now()->toISOString()
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error placing order', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while placing your order. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function show(Request $request, $orderId)
    {
        try {
            $order = Sales::where('order_id', $orderId)->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'order' => $order
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching order', [
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error fetching order'
            ], 500);
        }
    }

    public function updateStatus(Request $request, $orderId)
    {
        try {
            $request->validate([
                'status' => 'required|in:pending,processing,shipped,delivered,cancelled'
            ]);

            $order = Sales::where('order_id', $orderId)->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            $order->update([
                'order_status' => $request->status === 'delivered',
                'payment_status' => $request->status === 'delivered' ? Sales::PAYMENT_COMPLETED : $order->payment_status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order status updated successfully',
                'order' => $order
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating order status', [
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error updating order status'
            ], 500);
        }
    }
}
