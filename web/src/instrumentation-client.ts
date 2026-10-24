import * as Sentry from '@sentry/nextjs';

/*
 * Errors and page performance in visitors' browsers (Sentry project codlek-web).
 * Off without NEXT_PUBLIC_SENTRY_DSN (a developer's machine). Sends no personal
 * data, cookies or request bodies. No session replay: it would record visitors
 * on the pages with the contact and CV forms.
 */
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    dataCollection: { userInfo: false, cookies: false, httpBodies: [] },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
