{{-- About the shop: where it is, how to reach it, how buying works and common questions (StorePageController) --}}
@php
    use App\Support\Seo;

    $store = config('store');
    $address = $store['address']['line'].', '.$store['address']['area'];
    $mapsUrl = 'https://www.google.com/maps/search/?api=1&query='.rawurlencode($store['name'].', '.$address);
@endphp

<x-layout
    :title="Seo::title('Gadget Store in Ikeja, Lagos: Address & Contact')"
    :description="Seo::clip($store['name'].' sells brand new and UK used laptops, phones and gadgets at '.$store['address']['line'].', Ikeja, Lagos. Open '.$store['hours'].'.')"
    :schema="[Seo::store(), Seo::website(), Seo::breadcrumbs([['Home', '/'], ['About', '/about']]), Seo::faq($questions)]"
>
    <div class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <nav aria-label="Breadcrumb" class="mb-3">
            <ol class="flex items-center gap-1.5 text-sm text-gray-500">
                <li><a href="/" class="hover:text-ink">Home</a></li>
                <li aria-hidden="true"><x-icon name="chevron-right" class="size-3" /></li>
                <li class="text-ink" aria-current="page">About</li>
            </ol>
        </nav>

        <div class="max-w-[70ch]">
            <h1 class="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">About {{ $store['name'] }}</h1>
            <p class="mt-4 text-base leading-relaxed text-gray-700 sm:text-lg">
                {{ $store['name'] }} is a gadget store in Ikeja, Lagos. We sell laptops, phones, tablets, game consoles and accessories,
                brand new and UK used, and the condition of every item is stated on its page. You can pick up your order at the store
                or have it delivered to any state in Nigeria.
            </p>
        </div>

        <div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <section class="panel p-5 sm:p-6" aria-labelledby="about-visit">
                <x-icon name="shop" class="size-6 text-brand" />
                <h2 id="about-visit" class="mt-3 text-lg font-bold">Visit the store</h2>
                <address class="mt-2 text-sm leading-relaxed text-gray-700 not-italic">
                    {{ $store['address']['line'] }}<br>
                    {{ $store['address']['area'] }}
                </address>
                <p class="mt-2 text-sm text-gray-700">{{ $store['hours'] }}</p>
                <a href="{{ $mapsUrl }}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark">
                    Open in Google Maps
                    <x-icon name="chevron-right" class="size-4" />
                </a>
            </section>

            <section class="panel p-5 sm:p-6" aria-labelledby="about-contact">
                <x-icon name="call" class="size-6 text-brand" />
                <h2 id="about-contact" class="mt-3 text-lg font-bold">Contact us</h2>
                <ul class="mt-2 space-y-1.5 text-sm text-gray-700">
                    <li>Phone: <a href="tel:{{ $store['phone'] }}" class="font-semibold text-ink hover:text-brand">{{ $store['phone_display'] }}</a></li>
                    <li>WhatsApp: <a href="https://wa.me/{{ $store['whatsapp'] }}" target="_blank" rel="noopener noreferrer" class="font-semibold text-ink hover:text-brand">{{ $store['whatsapp_display'] }}</a></li>
                    <li>Email: <a href="mailto:{{ $store['email'] }}" class="font-semibold text-ink hover:text-brand">{{ $store['email'] }}</a></li>
                </ul>
                <a href="https://wa.me/{{ $store['whatsapp'] }}" target="_blank" rel="noopener noreferrer" class="btn btn-primary mt-4">
                    <x-icon name="whatsapp" />
                    Chat on WhatsApp
                </a>
            </section>

            <section class="panel p-5 sm:p-6" aria-labelledby="about-buying">
                <x-icon name="truck" class="size-6 text-brand" />
                <h2 id="about-buying" class="mt-3 text-lg font-bold">How buying works</h2>
                <ol class="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-gray-700">
                    <li>Add what you want to your cart and check out.</li>
                    <li>Pay by bank transfer. The account details are shown at checkout.</li>
                    <li>Send your proof of payment on WhatsApp.</li>
                    <li>Pick up in Ikeja, or we deliver to your state.</li>
                </ol>
            </section>
        </div>

        <section class="mt-10 max-w-[70ch]" aria-labelledby="about-questions">
            <h2 id="about-questions" class="text-2xl font-extrabold tracking-tight">Common questions</h2>
            <dl class="mt-4 divide-y divide-gray-200 border-y border-gray-200">
                @foreach($questions as $item)
                    <div class="py-4">
                        <dt class="font-bold">{{ $item['question'] }}</dt>
                        <dd class="mt-1.5 leading-relaxed text-gray-700">{{ $item['answer'] }}</dd>
                    </div>
                @endforeach
            </dl>
        </section>

        <section class="mt-10" aria-labelledby="about-shop">
            <h2 id="about-shop" class="text-2xl font-extrabold tracking-tight">Shop by category</h2>
            <ul class="mt-4 flex flex-wrap gap-2">
                <li><a href="/products" class="chip">All products</a></li>
                @foreach(\App\View\Composers\StoreNavigationComposer::categories() as $category)
                    <li><a href="{{ Seo::categoryPath($category) }}" class="chip">{{ $category->name }}</a></li>
                @endforeach
            </ul>
        </section>
    </div>
</x-layout>
