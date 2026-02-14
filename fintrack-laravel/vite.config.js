import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx', // atau app.jsx jika Anda tidak pakai TypeScript
            refresh: true,
        }),
        react(),
    ],
    optimizeDeps: {
        include: ['react-is', 'recharts', 'prop-types'],
    },
});