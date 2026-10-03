<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#14171c">
    <title>Admin Access - {{ config('store.name') }}</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="flex min-h-dvh items-center justify-center bg-gray-50 p-4 font-sans antialiased">
    <div class="panel w-full max-w-md p-6 text-center sm:p-10">
        <span class="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-light text-brand">
            <x-icon name="lock" class="size-7" />
        </span>

        <h1 class="mt-5 text-2xl font-extrabold tracking-tight">Admin access</h1>
        <p class="mt-2 text-sm text-gray-600">Manage your products, orders, and customer data.</p>

        <div class="mt-8 grid grid-cols-1 gap-2">
            <a href="{{ route('admin.dashboard') }}" class="btn btn-lg btn-primary">
                <x-icon name="category" />
                Enter admin dashboard
            </a>
            <a href="{{ url('/') }}" class="btn btn-lg btn-outline">
                <x-icon name="arrow-left" />
                Back to store
            </a>
        </div>
    </div>
</body>
</html>
