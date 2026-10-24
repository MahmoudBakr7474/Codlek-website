import * as Sentry from '@sentry/nextjs';

/*
 * Errors and slow requests on the server (Sentry project codlek-web), in the
 * Node.js and edge runtimes alike. Off without NEXT_PUBLIC_SENTRY_DSN (a
 * developer's machine). Sends no personal data, cookies, request bodies, local
 * variable values or request headers beyond a few harmless ones (Vercel adds
 * the visitor's IP and location as headers).
 */
export function register() {
    Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 0.1,
        dataCollection: {
            userInfo: false,
            cookies: false,
            httpBodies: [],
            stackFrameVariables: false,
            httpHeaders: { request: { allow: ['user-agent', 'accept-language', 'referer'] }, response: false },
        },
    });
}

// Errors thrown while rendering a page or running a route handler.
export const onRequestError = Sentry.captureRequestError;
