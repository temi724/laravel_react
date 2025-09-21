#!/bin/bash

echo "🚀 Deploying Order API fix to cPanel..."

# Upload the fixed OrderController.php to your cPanel
echo "📁 Files to upload to cPanel:"
echo "   - app/Http/Controllers/Api/OrderController.php"

# Clear caches on production
echo "🧹 Run these commands on your cPanel via terminal or SSH:"
echo "   php artisan cache:clear"
echo "   php artisan config:clear"
echo "   php artisan route:clear"

# Test the API endpoint
echo "🧪 Test your API at:"
echo "   POST https://www.murphylog.com.ng/api/orders/place"

echo ""
echo "✅ The OrderController now properly handles your cart data format!"
echo "   - Accepts direct array of cart items"
echo "   - Handles both string and numeric price values"
echo "   - Provides detailed debugging information"
echo "   - Creates proper order records in Sales table"

echo ""
echo "📋 Your cart data format is now supported:"
echo "   [{ id, cartItemId, type, name, price, quantity, image, subtotal, selected_storage, storage_price, selected_color }]"
