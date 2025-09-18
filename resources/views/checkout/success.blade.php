<x-layout>
    <div class="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <style>
            @keyframes successPulse {
                0% {
                    transform: scale(0.8);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.1);
                    opacity: 0.8;
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            @keyframes checkmarkDraw {
                0% {
                    stroke-dasharray: 0, 100;
                    opacity: 0;
                }
                50% {
                    opacity: 1;
                }
                100% {
                    stroke-dasharray: 100, 0;
                    opacity: 1;
                }
            }

            @keyframes ripple {
                0% {
                    transform: scale(1);
                    opacity: 0.6;
                }
                100% {
                    transform: scale(1.4);
                    opacity: 0;
                }
            }

            .success-circle {
                animation: successPulse 1s ease-out;
            }

            .checkmark-path {
                animation: checkmarkDraw 1.5s ease-out 0.5s both;
            }

            .ripple-effect {
                animation: ripple 2s infinite;
            }
        </style>
        <div class="max-w-md w-full bg-white rounded-2xl shadow-md p-8 text-center relative overflow-hidden">
            <!-- Decorative background -->
            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600"></div>

            <!-- Success Icon with Animation -->
            <div class="relative mx-auto w-32 h-32 mb-8">
                <!-- Ripple Effects -->
                <div class="absolute inset-0 bg-green-200 rounded-full ripple-effect"></div>
                <div class="absolute inset-0 bg-green-300 rounded-full ripple-effect" style="animation-delay: 0.5s;"></div>

                <!-- Main Success Circle -->
                <div class="relative w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg success-circle">
                    <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path class="checkmark-path" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
            </div>

            <!-- Success Message -->
            <h1 class="text-3xl font-bold text-gray-800 mb-3">Order Placed Successfully!</h1>
            <p class="text-lg text-gray-600 mb-2">Thank you for your purchase</p>
            <p class="text-sm text-gray-500 mb-8">You will receive an email confirmation shortly</p>

            <!-- Order Status -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                <div class="flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-green-800 font-medium">Payment instructions sent to your WhatsApp</span>
                </div>
            </div>

            <!-- Continue Shopping Icon Link -->
            <div class="space-y-4">
                <p class="text-gray-600 text-sm">Ready to explore more?</p>
                <a href="/" class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-lg group">
                    <svg class="w-8 h-8 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m.6 0L6 2H1m6 11v6a1 1 0 001 1h8a1 1 0 001-1v-6m-10 0h10"></path>
                    </svg>
                </a>
                <p class="text-xs text-gray-500">Continue Shopping</p>
            </div>

            <!-- Floating decorative elements -->
            <div class="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20"></div>
            <div class="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-20"></div>
        </div>
    </div>
</x-layout>
