import { House } from 'lucide-react';
import { locale as rootLocale } from 'next/root-params';
import { ButtonLink } from '@/components/ui/Button';
import { getSite } from '@/lib/api';
import { href, isLocale, translator } from '@/lib/i18n';

/** The same white panel as the other error pages, with the familiar "404" in place of the icon tile. */
export default async function NotFound() {
    const value = await rootLocale();
    const locale = isLocale(value) ? value : 'ar';
    const t = translator((await getSite(locale)).texts);

    return (
        <section className="py-16 sm:py-24">
            <title>{`${t('errors.404_title')} | ${t('brand')}`}</title>
            <div className="shell">
                <div className="mx-auto flex max-w-xl flex-col items-center rounded-panel border border-line bg-surface px-6 py-12 text-center shadow-panel sm:px-12 sm:py-14">
                    <p className="text-[5.5rem] leading-none font-extrabold text-primary-ink sm:text-[7rem]" dir="ltr" aria-hidden="true">
                        404
                    </p>
                    <h1 className="mt-6 text-[1.75rem] leading-[1.35] font-extrabold sm:text-4xl">{t('errors.404_title')}</h1>
                    <p className="mt-3 max-w-md text-[17px] text-ink-muted sm:text-lg">{t('errors.404_text')}</p>
                    <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                        <ButtonLink href={href(locale, 'home')} icon={House}>
                            {t('cta.home')}
                        </ButtonLink>
                        <ButtonLink href={href(locale, 'contact')} variant="outline">
                            {t('nav.contact')}
                        </ButtonLink>
                    </div>
                </div>
            </div>
        </section>
    );
}
