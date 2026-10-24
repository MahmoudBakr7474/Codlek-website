import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// With SENTRY_AUTH_TOKEN set (an org token from Sentry), the build uploads its source maps to Sentry
// for readable stack traces and leaves them out of the published files. Without it, it makes none.
const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

/*
 * The dashboard is served by the API under /admin (same origin, so its sign-in
 * cookie just works). In development the Vite server proxies /api to the API.
 * The build goes straight into the API's wwwroot/admin.
 */
export default defineConfig({
    base: '/admin/',
    plugins: [
        react(),
        // Tags the dashboard's Sentry events (project codlek-admin) with the git commit as the release.
        sentryVitePlugin({
            org: 'codlek',
            project: 'codlek-admin',
            authToken: process.env.SENTRY_AUTH_TOKEN,
            sourcemaps: {
                disable: !uploadSourceMaps,
                filesToDeleteAfterUpload: ['../api/src/Codlek.Api/wwwroot/admin/**/*.map'],
            },
            telemetry: false,
            silent: true,
        }),
    ],
    server: {
        port: 5173,
        proxy: {
            '/api': 'http://localhost:5080',
            '/uploads': 'http://localhost:5080',
        },
    },
    build: {
        outDir: '../api/src/Codlek.Api/wwwroot/admin',
        emptyOutDir: true,
        chunkSizeWarningLimit: 1500,
        sourcemap: uploadSourceMaps ? 'hidden' : false,
    },
});
