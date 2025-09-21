<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    <!-- Decorative background elements -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-md w-full space-y-8 relative z-10">
        <!-- Logo & Header -->
        <div class="text-center">
            <div class="mx-auto h-24 w-24 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300 ring-4 ring-white/50">
                <span class="text-white font-bold text-4xl tracking-tight">GS</span>
            </div>
            <h2 class="mt-8 text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">Admin Dashboard</h2>
            <p class="mt-3 text-base text-gray-600 font-medium">Welcome back! Please sign in to continue</p>
        </div>

        <!-- Login Form -->
        <form wire:submit.prevent="login" class="mt-10 space-y-6">
            <div class="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl p-10 border border-white/20 ring-1 ring-gray-200/50">
                <!-- Email Field -->
                <div class="space-y-8">
                    <div class="group">
                        <label for="email" class="block text-sm font-bold text-gray-800 mb-3 tracking-wide">Email Address</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg class="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                                </svg>
                            </div>
                            <input
                                wire:model="email"
                                id="email"
                                name="email"
                                type="email"
                                autocomplete="email"
                                required
                                class="appearance-none relative block w-full pl-12 pr-4 py-4 border @error('email') border-red-300 bg-red-50 @else border-gray-200 bg-gray-50 @enderror placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300 sm:text-sm hover:bg-white group-hover:shadow-lg"
                                placeholder="Enter your email address"
                            >
                        </div>
                        @error('email')
                            <p class="mt-3 text-sm text-red-600 flex items-center bg-red-50 p-3 rounded-lg border border-red-200">
                                <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                </svg>
                                {{ $message }}
                            </p>
                        @enderror
                    </div>

                    <!-- Password Field -->
                    <div class="group">
                        <label for="password" class="block text-sm font-bold text-gray-800 mb-3 tracking-wide">Password</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg class="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                </svg>
                            </div>
                            <input
                                wire:model="password"
                                id="password"
                                name="password"
                                type="password"
                                autocomplete="current-password"
                                required
                                class="appearance-none relative block w-full pl-12 pr-4 py-4 border @error('password') border-red-300 bg-red-50 @else border-gray-200 bg-gray-50 @enderror placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300 sm:text-sm hover:bg-white group-hover:shadow-lg"
                                placeholder="Enter your password"
                            >
                        </div>
                        @error('password')
                            <p class="mt-3 text-sm text-red-600 flex items-center bg-red-50 p-3 rounded-lg border border-red-200">
                                <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                </svg>
                                {{ $message }}
                            </p>
                        @enderror
                    </div>

                    <!-- Remember Me -->
                    <div class="flex items-center group">
                        <div class="relative">
                            <input
                                wire:model="remember"
                                id="remember"
                                name="remember"
                                type="checkbox"
                                class="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg"
                            >
                        </div>
                        <label for="remember" class="ml-4 block text-sm text-gray-700 font-semibold cursor-pointer select-none group-hover:text-gray-900 transition-colors duration-200">Remember me for 30 days</label>
                    </div>
                </div>

                <!-- Login Error -->
                @if($loginError)
                    <div class="mt-8 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-5 shadow-lg">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-sm font-bold text-red-800">Authentication Failed</h3>
                                <div class="mt-1 text-sm text-red-700">{{ $loginError }}</div>
                            </div>
                        </div>
                    </div>
                @endif

                <!-- Submit Button -->
                <div class="mt-8">
                    <button
                        type="submit"
                        class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        wire:loading.attr="disabled"
                    >
                        <span wire:loading.remove class="flex items-center">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                            </svg>
                            Sign in
                        </span>
                        <span wire:loading class="flex items-center">
                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                        </span>
                    </button>
                </div>
            </div>
        </form>

        <!-- Back to Store -->
        <div class="text-center">
            <a href="/" class="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to Store
            </a>
        </div>
    </div>
</div>

<script>
    document.addEventListener('livewire:init', () => {
        Livewire.on('redirect-to-dashboard', () => {
            // Immediate redirect
            window.location.href = '/admin/dashboard';
        });
    });
</script>
