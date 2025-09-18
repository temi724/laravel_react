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
        $request->validate([
            'username' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'deliveryOption' => 'required|in:pickup,delivery',
            'location' => 'required_if:deliveryOption,delivery|string|max:500',
            'city' => 'required_if:deliveryOption,delivery|string|max:100',
            'state' => 'required_if:deliveryOption,delivery|string|max:100',
            'paymentMethod' => 'required|in:bank_transfer,cash_on_delivery,card',
            'cartItems' => 'required|array',
            'cartTotal' => 'required|numeric|min:0',
        ]);

        try {
            // Use cartItems from request instead of session cart
            $cartItems = $request->cartItems;

            if (empty($cartItems)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cart is empty'
                ], 400);
            }

            // Generate unique order ID using same format as Livewire
            do {
                $orderId = 'ORD-' . date('Ymd') . '-' . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
            } while (Sales::where('order_id', $orderId)->exists());

            // Prepare order items data from request cartItems
            $productIds = [];
            $totalQuantity = 0;
            $orderDetails = [];

            foreach ($cartItems as $item) {
                $productIds[] = $item['id'];
                $totalQuantity += $item['quantity'];

                // Build detailed order information including storage selection
                $itemDetails = [
                    'id' => $item['id'],
                    'type' => $item['type'] ?? 'product',
                    'name' => $item['name'],
                    'price' => $item['price'],
                    'quantity' => $item['quantity'],
                    'subtotal' => $item['subtotal']
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

            // Create order record using same structure as Livewire
            $order = Sales::create([
                'order_id' => $orderId,
                'username' => $request->username,
                'emailaddress' => $request->email,
                'phonenumber' => $request->phone,
                'location' => $request->deliveryOption === 'delivery' ? $request->location : 'Pickup from Store - 123 Main Street, Ikeja, Lagos',
                'state' => $request->deliveryOption === 'delivery' ? $request->state : 'Lagos',
                'city' => $request->deliveryOption === 'delivery' ? $request->city : 'Ikeja',
                'product_ids' => $productIds,
                'quantity' => $totalQuantity,
                'order_status' => false, // Not completed yet
                'order_type' => $request->deliveryOption,
                'payment_status' => Sales::PAYMENT_PENDING,
                'order_details' => $orderDetails, // Store detailed order information including storage selections
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Log::info('Order placed successfully', [
                'order_id' => $orderId,
                'customer' => $request->username,
                'total' => $request->cartTotal,
                'items_count' => count($orderDetails)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully!',
                'orderId' => $orderId,
                'order' => $order
            ]);

        } catch (\Exception $e) {
            Log::error('Error placing order', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while placing your order. Please try again.'
            ], 500);
        }
    }

    public function show(Request $request, $orderId)
    {
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
    }

    public function updateStatus(Request $request, $orderId)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,processing,shipped,delivered,cancelled',
            'payment_status' => 'sometimes|in:pending,completed,failed,refunded'
        ]);

        $order = Sales::where('order_id', $orderId)->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        $order->update([
            'order_status' => $request->status,
            'payment_status' => $request->payment_status ?? $order->payment_status,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully',
            'order' => $order
        ]);
    }
}
