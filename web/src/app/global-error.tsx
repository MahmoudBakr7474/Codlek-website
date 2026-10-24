'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

/*
 * The last resort, when the root layout itself fails: the fonts, styles and
 * texts are what broke, so it shows a plain bilingual message. A server error
 * (it carries a digest) is already reported by instrumentation.ts.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
    useEffect(() => {
        if (!error.digest) {
            Sentry.captureException(error);
        }
    }, [error]);

    return (
        <html lang="ar" dir="rtl">
            <body style={{ margin: 0, padding: '4rem 1rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
                <h1>حدث خطأ غير متوقع</h1>
                <p>حاول مرة أخرى بعد قليل.</p>
                <p dir="ltr">Something went wrong. Please try again in a moment.</p>
                <Link href="/">الرئيسية · Home</Link>
            </body>
        </html>
    );
}
