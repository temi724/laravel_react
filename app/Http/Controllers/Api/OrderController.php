<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\InsufficientStock;
use App\Exceptions\OfferUnavailable;
use App\Http\Controllers\Controller;
use App\Models\Sales;
use App\Services\Inventory;
use App\Services\Offers;
use App\Services\OrderLines;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderLines $orderLines,
        private readonly Offers $offers,
    ) {}

    /**
     * Place an order from the storefront checkout.
     *
     * The browser says which items, options and quantities the customer wants. Names, prices
     * and stock always come from the database: a price sent by the browser is only compared
     * with the real one, so a changed or tampered cart is refused instead of being charged wrongly.
     */
    public function place(Request $request)
    {
        try {
            $data = $request->isJson() ? $request->json()->all() : $request->all();
            $data = is_array($data) ? $data : [];

            // Older clients send the same things under other names
            $data['cartItems'] = $data['cartItems'] ?? $data['items'] ?? null;
            $data['location'] = $data['deliveryAddress'] ?? $data['location'] ?? null;
            $data['deliveryOption'] = $data['deliveryOption'] ?? 'pickup';

            // Phone numbers are digits with an optional leading plus; spaces and dashes are dropped
            if (isset($data['phone']) && is_scalar($data['phone'])) {
                $data['phone'] = preg_replace('/[\s\-()]/', '', (string) $data['phone']);
            }

            $validator = Validator::make($data, [
                'username' => 'required|string|max:120',
                'email' => 'required|email|max:190',
                'phone' => ['required', 'string', 'regex:/^\+?\d{10,15}$/'],
                'deliveryOption' => 'required|in:pickup,delivery',
                'location' => 'required_if:deliveryOption,delivery|nullable|string|max:255',
                'city' => 'required_if:deliveryOption,delivery|nullable|string|max:100',
                'state' => 'required_if:deliveryOption,delivery|nullable|string|max:100',
                // The checkout shows the customer an order ID before the order is saved, so it arrives with it
                'orderId' => ['nullable', 'string', 'regex:/^ORD-\d{8}-[A-Z0-9]{6,10}$/'],
                'cartItems' => 'required|array|min:1|max:50',
                'cartItems.*.id' => 'required|alpha_num|max:40',
                'cartItems.*.type' => 'nullable|string|in:product,deal,bundle',
                'cartItems.*.quantity' => 'required|integer|min:1|max:1000',
                'cartItems.*.price' => 'nullable|numeric|min:0',
                'cartItems.*.selected_storage' => 'nullable|string|max:60',
                'cartItems.*.selected_color' => 'nullable|string|max:60',
            ], [
                'username.required' => 'Enter your full name',
                'email.required' => 'Enter your email address',
                'email.email' => 'Please enter a valid email address',
                'phone.required' => 'Enter your phone number',
                'phone.regex' => 'Enter a valid phone number, digits only',
                'location.required_if' => 'Enter your delivery address',
                'city.required_if' => 'Enter your city',
                'state.required_if' => 'Enter your state',
                'orderId.regex' => 'This order reference is not valid. Reload the page and try again.',
                'cartItems.required' => 'Your cart is empty',
                'cartItems.*.quantity.*' => 'One of the quantities in your cart is not valid',
            ]);

            if ($validator->fails()) {
                // One message per field, the shape the checkout form reads
                $errors = collect($validator->errors()->toArray())->map(fn ($messages) => $messages[0])->all();

                return response()->json([
                    'success' => false,
                    'message' => reset($errors),
                    'errors' => $errors,
                ], 422);
            }

            $input = $validator->validated();

            // Price every line from the database: products, flash deals and bundles, with any
            // deal of the day or drop price that is running right now
            $priced = $this->orderLines->price(
                array_values($input['cartItems']),
                array_map(fn ($item) => (string) ($item['name'] ?? 'An item in your cart'), array_values($data['cartItems']))
            );
            $orderDetails = $priced['lines'];
            $problems = $priced['problems'];

            if ($problems !== []) {
                return response()->json([
                    'success' => false,
                    'message' => $problems[0],
                    'problems' => $problems,
                ], 422);
            }

            $total = round(array_sum(array_column($orderDetails, 'subtotal')), 2);

            // Generate unique order ID (use provided if available, otherwise generate)
            $orderId = $input['orderId'] ?? null;
            if ($orderId) {
                // Check if this order ID already exists
                if (Sales::where('order_id', $orderId)->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Order ID already exists',
                        'orderId' => $orderId,
                    ], 409);
                }
            } else {
                do {
                    $orderId = 'ORD-'.strtoupper(Str::random(8)).'-'.time();
                } while (Sales::where('order_id', $orderId)->exists());
            }

            $delivery = $input['deliveryOption'] === 'delivery';
            $customerData = [
                'username' => $input['username'],
                'email' => $input['email'],
                'phone' => $input['phone'],
                'delivery_option' => $input['deliveryOption'],
                'location' => $delivery ? $input['location'] : 'Pickup from Store - Murphy Log Computers',
                'city' => $delivery ? $input['city'] : 'Lagos',
                'state' => $delivery ? $input['state'] : 'Lagos',
                'payment_method' => 'bank_transfer',
            ];

            // The order is saved and its offer units are held together: if a drop sells out
            // between the check above and now, nothing is saved.
            DB::transaction(function () use ($orderDetails, $orderId, $customerData, $total) {
                foreach ($orderDetails as $line) {
                    if (! empty($line['promotion_id']) && ($problem = $this->offers->reserve((int) $line['promotion_id'], (int) $line['quantity']))) {
                        throw new OfferUnavailable($problem); // rolls everything back
                    }
                }

                // Create order record
                Sales::create([
                    'order_id' => $orderId,
                    'username' => $customerData['username'],
                    'emailaddress' => $customerData['email'],
                    'phonenumber' => $customerData['phone'],
                    'location' => $customerData['location'],
                    'state' => $customerData['state'],
                    'city' => $customerData['city'],
                    'product_ids' => $this->productIds($orderDetails),
                    'quantity' => array_sum(array_column($orderDetails, 'quantity')),
                    'order_status' => false, // Not completed yet
                    'order_type' => $customerData['delivery_option'],
                    'payment_status' => Sales::PAYMENT_PENDING,
                    'payment_method' => $customerData['payment_method'],
                    'order_details' => $orderDetails,
                    'subtotal' => $total,
                    'total_amount' => $total,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });

            // No customer details in the log: the order itself holds them
            Log::info('Order placed successfully', [
                'order_id' => $orderId,
                'total' => $total,
                'items_count' => count($orderDetails),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully!',
                'orderId' => $orderId,
                'order' => [
                    'id' => $orderId,
                    'total' => $total,
                    'items' => $orderDetails,
                    'customer' => $customerData,
                    'status' => 'pending',
                    'created_at' => now()->toISOString(),
                ],
            ], 201);

        } catch (OfferUnavailable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'problems' => [$e->getMessage()]], 422);
        } catch (\Exception $e) {
            Log::error('Error placing order', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while placing your order. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * The products on an order: a bundle counts as the products inside it.
     *
     * @param  list<array<string, mixed>>  $lines
     * @return list<string>
     */
    private function productIds(array $lines): array
    {
        $ids = [];
        foreach ($lines as $line) {
            if (($line['type'] ?? '') === 'bundle') {
                array_push($ids, ...array_column($line['components'] ?? [], 'id'));
            } else {
                $ids[] = $line['id'];
            }
        }

        return array_values(array_unique($ids));
    }

    public function show(Request $request, $orderId)
    {
        try {
            $order = Sales::where('order_id', $orderId)->first();

            if (! $order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'order' => $order,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching order', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error fetching order',
            ], 500);
        }
    }

    public function updateStatus(Request $request, $orderId)
    {
        try {
            $request->validate([
                'status' => 'required|in:pending,processing,shipped,delivered,cancelled',
            ]);

            $order = Sales::where('order_id', $orderId)->first();

            if (! $order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found',
                ], 404);
            }

            DB::transaction(function () use ($request, $order) {
                // Delivered means confirmed: the units leave stock. A cancelled order gives them back.
                if ($request->status === 'delivered') {
                    Inventory::deduct($order);
                } elseif ($request->status === 'cancelled') {
                    Inventory::restore($order);
                    $this->offers->release($order);
                }

                $delivered = $request->status === 'delivered';
                $order->update([
                    'order_status' => $delivered,
                    'payment_status' => $delivered ? Sales::PAYMENT_COMPLETED : $order->payment_status,
                    'completed_at' => $delivered ? now() : $order->completed_at,
                    'approved_by_admin' => $delivered ? ($order->approved_by_admin ?: $request->get('authenticated_admin')?->name) : $order->approved_by_admin,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Order status updated successfully',
                'order' => $order,
            ]);

        } catch (InsufficientStock $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating order status', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error updating order status',
            ], 500);
        }
    }
}
