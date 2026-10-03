<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#14171c">
    <title>@yield('title', 'Admin Dashboard') - {{ config('app.name') }}</title>

    <!-- Scripts (Manrope is bundled with the stylesheet) -->
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

@php
    // The signed-in admin (set by the AdminAuth middleware)
    $admin = request()->attributes->get('admin');
    $adminName = $admin?->name ?? session('admin_name', 'Admin');
    $adminInitial = strtoupper(mb_substr($adminName, 0, 1));
    $isSuperAdmin = (bool) $admin?->isSuperAdmin();
    $adminForScripts = [
        'id' => (string) ($admin?->id ?? ''),
        'name' => $adminName,
        'is_super' => $isSuperAdmin,
        'permissions' => $admin?->permissions() ?? [],
    ];

    // Sidebar navigation. `match` is the route pattern that marks the item as current;
    // `can` is the permission the admin needs to see the item ('super' for the super admin only).
    $navItems = array_filter([
        ['label' => 'Dashboard', 'route' => 'admin.dashboard', 'match' => 'admin.dashboard*', 'icon' => 'category'],
        ['label' => 'Products', 'route' => 'admin.products', 'match' => 'admin.products*', 'icon' => 'box'],
        ['label' => 'Categories', 'route' => 'admin.categories', 'match' => 'admin.categories*', 'icon' => 'tag', 'can' => 'categories.manage'],
        ['label' => 'Offers', 'route' => 'admin.offers', 'match' => 'admin.offers*', 'icon' => 'discount', 'can' => 'offers.manage'],
        ['label' => 'Sales & Orders', 'route' => 'admin.sales', 'match' => 'admin.sales*', 'icon' => 'receipt', 'can' => 'sales.view'],
        ['label' => 'Order Management', 'route' => 'admin.orders', 'match' => 'admin.orders*', 'icon' => 'search', 'can' => 'sales.view'],
        ['label' => 'Settings', 'route' => 'admin.settings', 'match' => 'admin.settings*', 'icon' => 'setting', 'can' => 'super'],
    ], fn ($item) => ! isset($item['can']) || ($item['can'] === 'super' ? $isSuperAdmin : (bool) $admin?->canDo($item['can'])));
@endphp

<body class="bg-gray-50 font-sans antialiased">
    <script>
        // Store details for the React components (config/store.php)
        window.MurphylogStore = @json(config('store'));
        // Who is signed in and what they may do. This only decides what is shown: the server checks every action.
        window.MurphylogAdmin = @json($adminForScripts);
    </script>

    <div class="flex h-dvh overflow-hidden" x-data="{ sidebarOpen: false }" @keydown.escape.window="sidebarOpen = false">
        <!-- Mobile sidebar overlay -->
        <div
            x-show="sidebarOpen"
            x-transition.opacity.duration.200ms
            @click="sidebarOpen = false"
            class="fixed inset-0 z-40 bg-ink/50 lg:hidden"
            x-cloak
        ></div>

        <!-- Sidebar -->
        <aside
            id="sidebar"
            :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
            class="fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-ink text-white transition-transform duration-300 ease-drawer motion-reduce:transition-none lg:static lg:translate-x-0"
        >
            <div class="flex h-16 shrink-0 items-center gap-2 px-5">
                <a href="{{ route('admin.dashboard') }}" class="text-lg font-extrabold tracking-tight">Murphylog</a>
                <span class="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">Admin</span>
            </div>

            <nav class="flex-1 overflow-y-auto px-3 py-2" aria-label="Admin">
                <ul class="space-y-1">
                    @foreach($navItems as $item)
                        @php $current = request()->routeIs($item['match']); @endphp
                        <li>
                            <a href="{{ route($item['route']) }}"
                               @if($current) aria-current="page" @endif
                               class="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors {{ $current ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white' }}">
                                <x-icon :name="$item['icon']" class="size-5 shrink-0" />
                                {{ $item['label'] }}
                            </a>
                        </li>
                    @endforeach
                </ul>

                <div class="mt-6 border-t border-white/10 pt-4">
                    @if($admin?->canDo('products.create'))
                        <a href="{{ route('admin.products.create') }}" class="btn btn-primary w-full">
                            <x-icon name="add" />
                            Add product
                        </a>
                    @endif
                    <a href="{{ url('/') }}" target="_blank" rel="noopener" class="mt-2 flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white">
                        <x-icon name="shop" class="size-5 shrink-0" />
                        View store
                    </a>
                </div>
            </nav>

            <div class="shrink-0 border-t border-white/10 p-3">
                <div class="flex items-center gap-3 rounded-xl px-2 py-2">
                    <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">{{ $adminInitial }}</span>
                    <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-semibold">{{ $adminName }}</p>
                        <p class="text-xs text-white/50">{{ $isSuperAdmin ? 'Super admin' : 'Administrator' }}</p>
                    </div>
                    <form method="POST" action="{{ route('admin.logout') }}">
                        @csrf
                        <button type="submit" class="flex size-9 items-center justify-center rounded-full text-white/65 transition-colors hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out">
                            <x-icon name="logout" class="size-5" />
                        </button>
                    </form>
                </div>
            </div>
        </aside>

        <!-- Main Content Area -->
        <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
            <!-- Top Header -->
            <header class="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
                <!-- Mobile menu button -->
                <button type="button" class="flex size-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-gray-100 lg:hidden" @click="sidebarOpen = true" aria-label="Open menu" aria-controls="sidebar" :aria-expanded="sidebarOpen">
                    <x-icon name="menu" class="size-6" />
                </button>

                <!-- Page Title -->
                <div class="min-w-0 flex-1">
                    <h1 class="truncate text-lg leading-tight font-extrabold tracking-tight sm:text-xl">@yield('page-title', 'Dashboard')</h1>
                    <p class="hidden truncate text-sm text-gray-600 sm:block">@yield('page-description', 'Manage your application')</p>
                </div>

                <!-- Header Actions -->
                <a href="{{ url('/') }}" target="_blank" rel="noopener" class="btn btn-sm btn-outline hidden sm:inline-flex">
                    <x-icon name="shop" class="size-4 shrink-0" />
                    View store
                </a>
            </header>

            <!-- Main Content -->
            <main class="flex-1 overflow-y-auto">
                <div class="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">
                    @yield('content')
                </div>
            </main>
        </div>
    </div>
</body>
</html>
