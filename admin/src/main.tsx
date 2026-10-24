import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/*
 * Errors and slow pages in the dashboard (Sentry project codlek-admin). Off
 * without VITE_SENTRY_DSN, which the build reads from admin/.env.production.local
 * (not in git). The dashboard shows messages and CVs, so no personal data,
 * cookies, request bodies or URL queries (the search boxes take names, emails
 * and phones) are sent. Reports go through the API (/api/monitoring), so ad
 * blockers and tracking prevention don't drop them.
 */
Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tunnel: '/api/monitoring',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    dataCollection: { userInfo: false, cookies: false, httpBodies: [], urlQueryParams: false },
});

createRoot(document.getElementById('root')!, {
    onUncaughtError: Sentry.reactErrorHandler(),
    onCaughtError: Sentry.reactErrorHandler(),
    onRecoverableError: Sentry.reactErrorHandler(),
}).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
