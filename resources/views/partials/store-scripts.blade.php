{{-- Shared storefront scripts and the cart drawer mount --}}
<script>
    // Contact, pickup and payment details for the React components (config/store.php)
    window.MurphylogStore = @json(config('store'));

    // The deal of the day, drops and bundles running now (App\Services\Offers)
    window.MurphylogOffers = @json($storeOffers);

    // Remove Alpine cart storage since we're using the React cart now
    document.addEventListener('DOMContentLoaded', function () {
        localStorage.removeItem('alpineCartCount');
    });

    // Handle add-to-cart events from anywhere in the app
    window.addEventListener('add-to-cart', function (event) {
        if (event.detail?.productId && window.useCartStore) {
            window.useCartStore.getState().addToCart(event.detail.productId, 1, event.detail.type || 'product');
        }
    });

    // Handle open-cart events
    window.addEventListener('open-cart', function () {
        if (window.useCartStore) {
            window.useCartStore.getState().openCart();
        } else {
            // Fallback - redirect to cart page
            window.location.href = '/cart';
        }
    });
</script>

{{-- React Cart Component --}}
@include('react.cart')
