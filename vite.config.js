import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
    optimizeDeps: {
        include: ['react-is', 'recharts', 'prop-types', 'date-fns', 'dayjs'],
    },
    build: {
        target: 'es2018', // Support Safari 12+
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-is'],
                    'vendor-charts': ['recharts'],
                    'vendor-motion': ['framer-motion'],
                    'vendor-utils': ['date-fns', 'dayjs', 'canvas-confetti'],
                },
            },
        },
    },
});