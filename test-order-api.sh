#!/bin/bash

echo "🧪 Testing Order API with your cart data..."

# Test data in your exact format
curl -X POST http://127.0.0.1:8000/api/orders/place \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '[
    {
        "id": "68cc941b00036187006e6e6a",
        "cartItemId": "68cc941b00036187006e6e6a_none_none_1758362815032",
        "type": "product",
        "name": "HP Spectre x360 (13th-Gen Core i7 / 16 GB / 512 GB)",
        "price": 1800000,
        "quantity": 1,
        "image": "/images/products/DqQdw0Klb1qTwvxljHjpgcTgdQGOIgGUk15k48dw.jpg",
        "subtotal": 1800000,
        "selected_storage": null,
        "storage_price": 1800000,
        "selected_color": null
    },
    {
        "id": "68cc968000039907000bf751",
        "cartItemId": "68cc968000039907000bf751_none_none_1758375932508",
        "type": "product",
        "name": "HP Pavilion 14 x360 Convertible – 12th Gen Core i5 / 8 GB / 512 GB",
        "price": "520000.00",
        "quantity": 2,
        "image": "/images/products/QoMyu9mCMtXMRqwZDp6NFj8JFP4IreFl6uAkY7Ar.jpg",
        "subtotal": 1040000,
        "selected_storage": "",
        "storage_price": "520000.00",
        "selected_color": ""
    }
]' | python3 -m json.tool

echo ""
echo "✅ Test completed!"
