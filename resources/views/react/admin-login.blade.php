<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#14171c">
    <title>Admin Login - {{ config('app.name') }}</title>

    <!-- Scripts (Manrope is bundled with the stylesheet) -->
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-white font-sans antialiased">
    <script>
        window.MurphylogStore = @json(config('store'));
    </script>

    {{-- React AdminLogin Component --}}
    <div data-react-component="AdminLogin"></div>
</body>
</html>
