'use client';

import { useParams } from 'next/navigation';
import { House, RotateCcw, ServerCrash } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/IconTile';
import { href, isLocale } from '@/lib/i18n';

/*
 * A page that failed to render. A client component, so it can't read the texts
 * from the API (the API may be what failed): it carries the shipped 500 texts of
 * both languages.
 */
const texts = {
    ar: {
        title: 'حدث خطأ غير متوقع',
        text: 'واجهتنا مشكلة أثناء عرض هذه الصفحة. حاول مرة أخرى بعد قليل، أو راسلنا على واتساب.',
        home: 'العودة للرئيسية',
        retry: 'حاول مرة أخرى',
    },
    en: {
        title: 'Something went wrong',
        text: 'We hit a problem while loading this page. Please try again in a moment, or message us on WhatsApp.',
        home: 'Back to home',
        retry: 'Try again',
    },
};

export default function PageError({ reset }: { error: Error; reset: () => void }) {
    const params = useParams<{ locale: string }>();
    const locale = isLocale(params.locale) ? params.locale : 'ar';
    const t = texts[locale];

    return (
        <section className="py-16 sm:py-24">
            <div className="shell">
                <div className="mx-auto flex max-w-xl flex-col items-center rounded-panel border border-line bg-surface px-6 py-12 text-center shadow-panel sm:px-12 sm:py-14">
                    <IconTile icon={ServerCrash} size="lg" />
                    <h1 className="mt-6 text-[1.75rem] leading-[1.35] font-extrabold sm:text-4xl">{t.title}</h1>
                    <p className="mt-3 max-w-md text-[17px] text-ink-muted sm:text-lg">{t.text}</p>
                    <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                        <Button onClick={reset} icon={RotateCcw}>
                            {t.retry}
                        </Button>
                        <ButtonLink href={href(locale, 'home')} variant="outline" icon={House}>
                            {t.home}
                        </ButtonLink>
                    </div>
                </div>
            </div>
        </section>
    );
}
