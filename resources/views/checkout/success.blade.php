{{-- Not a page for search results --}}
<x-layout :title="\App\Support\Seo::title('Order placed')" robots="noindex, follow">

    <div class="mx-auto flex min-h-[60dvh] max-w-[1440px] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div class="panel w-full max-w-lg animate-rise p-6 text-center sm:p-10">
            <span class="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-light text-brand">
                <x-icon name="bag-tick" class="size-8" />
            </span>

            <h1 class="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">Order placed</h1>
            <p class="mx-auto mt-3 max-w-sm leading-relaxed text-gray-600">
                Thank you for your purchase. Send your proof of payment on WhatsApp and we will confirm your order and arrange pickup or delivery.
            </p>

            <div class="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <a href="https://wa.me/{{ config('store.whatsapp') }}?text={{ rawurlencode('Payment proof for my order') }}" target="_blank" rel="noopener noreferrer" class="btn btn-lg btn-primary">
                    <x-icon name="whatsapp" />
                    Send proof
                </a>
                <a href="/#products" class="btn btn-lg btn-outline">
                    Continue shopping
                </a>
            </div>

            <p class="mt-6 text-sm text-gray-500">
                Questions? Call <a href="tel:{{ config('store.phone') }}" class="font-semibold text-ink hover:text-brand">{{ config('store.phone_display') }}</a>
            </p>
        </div>
    </div>
</x-layout>
