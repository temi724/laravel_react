<footer class="mt-16 bg-ink text-white">
    <div class="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div class="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
                <p class="text-xl font-extrabold tracking-tight">{{ config('store.name') }}</p>
                <p class="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
                    Laptops, phones and gadgets, brand new and UK used. Pick up in Ikeja or have your order delivered anywhere in Nigeria.
                </p>
                <a href="https://wa.me/{{ config('store.whatsapp') }}" target="_blank" rel="noopener noreferrer" class="btn btn-on-ink mt-6">
                    <x-icon name="whatsapp" />
                    Chat on WhatsApp
                </a>
            </div>

            <div>
                <h2 class="text-sm font-semibold">Visit the store</h2>
                <address class="mt-4 space-y-1 text-sm leading-relaxed text-white/70 not-italic">
                    <p>{{ config('store.address.line') }}</p>
                    <p>{{ config('store.address.area') }}</p>
                    <p class="pt-2">{{ config('store.hours') }}</p>
                </address>
            </div>

            <div>
                <h2 class="text-sm font-semibold">Contact</h2>
                <ul class="mt-4 space-y-2 text-sm text-white/70">
                    <li>
                        <a href="tel:{{ config('store.phone') }}" class="transition-colors hover:text-white">{{ config('store.phone_display') }}</a>
                    </li>
                    <li>
                        <a href="https://wa.me/{{ config('store.whatsapp') }}" target="_blank" rel="noopener noreferrer" class="transition-colors hover:text-white">WhatsApp {{ config('store.whatsapp_display') }}</a>
                    </li>
                    <li>Delivery to {{ lcfirst(config('store.delivery')) }}</li>
                    <li>
                        <a href="/about" class="transition-colors hover:text-white">About the store</a>
                    </li>
                    <li>
                        <a href="/products" class="transition-colors hover:text-white">All products</a>
                    </li>
                </ul>
            </div>

            <div>
                <h2 class="text-sm font-semibold">Follow</h2>
                <ul class="mt-4 space-y-2 text-sm text-white/70">
                    @foreach(config('store.social') as $label => $url)
                        <li>
                            <a href="{{ $url }}" target="_blank" rel="noopener noreferrer" class="transition-colors hover:text-white">{{ $label }}</a>
                        </li>
                    @endforeach
                </ul>
            </div>
        </div>

        <div class="mt-12 border-t border-white/10 pt-6 text-sm text-white/50">
            <p>&copy; 2025 Zelda Devs. All rights reserved.</p>
        </div>
    </div>
</footer>
