import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core React libraries
                    'react-vendor': ['react', 'react-dom'],

                    // State management
                    'state-vendor': ['zustand'],

                    // PDF and heavy libraries
                    'pdf-vendor': ['html2pdf.js'],

                    // Admin-specific chunks (lazy loaded)
                    'admin-core': [
                        './resources/js/components/admin/AdminLogin.jsx',
                        './resources/js/components/admin/AdminDashboard.jsx'
                    ],
                    'admin-products': [
                        './resources/js/components/admin/AdminProductManager.jsx',
                        './resources/js/components/admin/AdminProductCreate.jsx',
                        './resources/js/components/admin/AdminProductEdit.jsx'
                    ],
                    'admin-sales': [
                        './resources/js/components/admin/AdminSalesManager.jsx',
                        './resources/js/components/admin/AdminOrderManager.jsx',
                        './resources/js/components/admin/InvoiceView.jsx'
                    ],

                    // Customer-facing components
                    'customer-core': [
                        './resources/js/components/ProductGrid.jsx',
                        './resources/js/components/SearchBar.jsx'
                    ],
                    'customer-cart': [
                        './resources/js/components/Cart.jsx',
                        './resources/js/components/CartPage.jsx',
                        './resources/js/components/CartCounter.jsx'
                    ],
                    'customer-checkout': [
                        './resources/js/components/CheckoutPage.jsx',
                        './resources/js/components/ProductShow.jsx'
                    ]
                }
            }
        },
        // Use esbuild for faster builds (default minifier)
        minify: 'esbuild',
        // Enable CSS code splitting
        cssCodeSplit: true,
        // Increase chunk size warning limit but keep it reasonable
        chunkSizeWarningLimit: 800,
        // Target modern browsers for better optimization
        target: 'esnext',
        // Enable source maps for production debugging
        sourcemap: false,
        // Improve tree shaking
        modulePreload: false
    },
    // Remove console.logs in production using esbuild
    esbuild: {
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    // Optimize dependencies
    optimizeDeps: {
        include: ['react', 'react-dom', 'zustand', 'html2pdf.js'],
        exclude: [] // Allow html2pdf.js to be optimized
    },
    // Optimize for better caching
    server: {
        host: true,
    },
});
