<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Deal;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $cart = session()->get('cart', []);
        $cartItems = [];
        $cartTotal = 0;
        $cartCount = 0;

        foreach ($cart as $itemId => $item) {
            $type = $item['type'] ?? 'product';
            $quantity = $item['quantity'] ?? 1;
            $selectedStorage = $item['selected_storage'] ?? null;
            $storagePrice = $item['storage_price'] ?? null;

            if ($type === 'deal') {
                $deal = Deal::find($itemId);
                if ($deal) {
                    $itemPrice = $storagePrice ?? $deal->price;
                    $cartItems[] = [
                        'id' => $deal->id,
                        'type' => 'deal',
                        'name' => $deal->product_name,
                        'price' => $itemPrice,
                        'quantity' => $quantity,
                        'image' => $deal->images_url && count($deal->images_url) > 0 ? $deal->images_url[0] : null,
                        'subtotal' => $itemPrice * $quantity,
                        'selected_storage' => $selectedStorage,
                        'storage_price' => $storagePrice
                    ];
                    $cartTotal += $itemPrice * $quantity;
                    $cartCount += $quantity;
                }
            } else {
                $product = Product::find($itemId);
                if ($product) {
                    $itemPrice = $storagePrice ?? $product->price;
                    $cartItems[] = [
                        'id' => $product->id,
                        'type' => 'product',
                        'name' => $product->product_name,
                        'price' => $itemPrice,
                        'quantity' => $quantity,
                        'image' => $product->images_url && count($product->images_url) > 0 ? $product->images_url[0] : null,
                        'subtotal' => $itemPrice * $quantity,
                        'selected_storage' => $selectedStorage,
                        'storage_price' => $storagePrice
                    ];
                    $cartTotal += $itemPrice * $quantity;
                    $cartCount += $quantity;
                }
            }
        }

        return response()->json([
            'success' => true,
            'cart' => $cartItems,
            'total' => $cartTotal,
            'count' => $cartCount
        ]);
    }

    public function getCount(Request $request)
    {
        $cart = session()->get('cart', []);
        $count = 0;

        foreach ($cart as $item) {
            $count += is_array($item) ? ($item['quantity'] ?? 0) : $item;
        }

        return response()->json(['count' => $count]);
    }

    public function add(Request $request)
    {
        $request->validate([
            'itemId' => 'required',
            'quantity' => 'integer|min:1',
            'type' => 'string|in:product,deal',
            'selectedStorage' => 'nullable|string',
            'storagePrice' => 'nullable|numeric',
            'selectedColor' => 'nullable|string',
        ]);

        $itemId = $request->itemId;
        $quantity = $request->quantity ?? 1;
        $type = $request->type ?? 'product';
        $selectedStorage = $request->selectedStorage;
        $storagePrice = $request->storagePrice;
        $selectedColor = $request->selectedColor;

        $cart = session()->get('cart', []);

        if (isset($cart[$itemId])) {
            $cart[$itemId]['quantity'] += $quantity;
            if ($selectedStorage) {
                $cart[$itemId]['selected_storage'] = $selectedStorage;
                $cart[$itemId]['storage_price'] = $storagePrice;
            }
            if ($selectedColor) {
                $cart[$itemId]['selected_color'] = $selectedColor;
            }
        } else {
            $cart[$itemId] = [
                'quantity' => $quantity,
                'type' => $type,
                'selected_storage' => $selectedStorage,
                'storage_price' => $storagePrice,
                'selected_color' => $selectedColor,
            ];
        }

        session()->put('cart', $cart);

        // Get product/deal name for response
        $itemName = 'Item';
        if ($type === 'deal') {
            $deal = Deal::find($itemId);
            $itemName = $deal ? $deal->product_name : 'Deal';
        } else {
            $product = Product::find($itemId);
            $itemName = $product ? $product->product_name : 'Product';
        }

        return response()->json([
            'success' => true,
            'message' => "{$itemName} added to cart successfully!",
            'cart_count' => $this->getTotalItems()
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'itemId' => 'required',
            'quantity' => 'required|integer|min:1'
        ]);

        $itemId = $request->itemId;
        $quantity = $request->quantity;

        $cart = session()->get('cart', []);

        if (isset($cart[$itemId])) {
            $cart[$itemId]['quantity'] = $quantity;
            session()->put('cart', $cart);

            return response()->json([
                'success' => true,
                'message' => 'Cart updated successfully!'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Item not found in cart'
        ], 404);
    }

    public function updateStorage(Request $request)
    {
        $request->validate([
            'itemId' => 'required',
            'storageOption' => 'required|string',
            'storagePrice' => 'required|numeric'
        ]);

        $itemId = $request->itemId;
        $storageOption = $request->storageOption;
        $storagePrice = $request->storagePrice;

        $cart = session()->get('cart', []);

        if (isset($cart[$itemId])) {
            $cart[$itemId]['selected_storage'] = $storageOption;
            $cart[$itemId]['storage_price'] = $storagePrice;
            session()->put('cart', $cart);

            return response()->json([
                'success' => true,
                'message' => 'Storage option updated successfully!'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Item not found in cart'
        ], 404);
    }

    public function remove(Request $request, $itemId)
    {
        $cart = session()->get('cart', []);

        if (isset($cart[$itemId])) {
            unset($cart[$itemId]);
            session()->put('cart', $cart);

            return response()->json([
                'success' => true,
                'message' => 'Item removed from cart!'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Item not found in cart'
        ], 404);
    }

    public function clear(Request $request)
    {
        session()->forget('cart');

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared successfully!'
        ]);
    }

    private function getTotalItems()
    {
        $cart = session()->get('cart', []);
        $count = 0;

        foreach ($cart as $item) {
            $count += is_array($item) ? ($item['quantity'] ?? 0) : $item;
        }

        return $count;
    }
}
