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
                    // Split vendor libraries into separate chunks
                    'react-vendor': ['react', 'react-dom'],
                    'utils': ['zustand'],
                }
            }
        },
        // Use esbuild for faster builds (default minifier)
        minify: 'esbuild',
        // Enable CSS code splitting
        cssCodeSplit: true,
        // Optimize chunk size
        chunkSizeWarningLimit: 1000,
    },
    // Remove console.logs in production using esbuild
    esbuild: {
        drop: ['console', 'debugger'],
    },
    // Optimize for better caching
    server: {
        host: true,
    },
});
