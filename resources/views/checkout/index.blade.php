{{-- Not a page for search results --}}
<x-layout :title="\App\Support\Seo::title('Checkout')" robots="noindex, follow">

    <div class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {{-- Checkout Content --}}
        @include('react.checkout-page')
    </div>
</x-layout>
