{{-- Page not found: a way back to the products instead of a dead end --}}
<x-layout :title="\App\Support\Seo::title('Page not found')" robots="noindex, follow">
    <div class="mx-auto flex min-h-[50dvh] max-w-[1440px] items-center px-4 py-12 sm:px-6 lg:px-8">
        <div class="max-w-xl">
            <p class="text-sm font-semibold text-brand">Error 404</p>
            <h1 class="mt-2 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">We could not find that page</h1>
            <p class="mt-3 leading-relaxed text-gray-600">
                The product may have been sold or renamed, or the link is incorrect. Search for it above, or start from one of these.
            </p>

            <div class="mt-6 flex flex-wrap gap-3">
                <a href="/products" class="btn btn-lg btn-primary">Browse all products</a>
                <a href="/" class="btn btn-lg btn-outline">Go to the home page</a>
            </div>

            <ul class="mt-8 flex flex-wrap gap-2">
                @foreach(\App\View\Composers\StoreNavigationComposer::categories() as $category)
                    <li><a href="{{ \App\Support\Seo::categoryPath($category) }}" class="chip">{{ $category->name }}</a></li>
                @endforeach
            </ul>
        </div>
    </div>
</x-layout>
