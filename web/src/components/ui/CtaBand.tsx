import { ArrowRight } from 'lucide-react';
import { href, type Locale, type Translate } from '@/lib/i18n';
import { cx } from '@/lib/cx';
import { ButtonLink } from './Button';

/*
 * Closing call to action: the design's blue band, shared by most pages. The
 * section takes the background of wherever it sits; pass classes for another
 * slot (e.g. "border-y border-line bg-surface").
 */
export function CtaBand({ locale, t, className }: { locale: Locale; t: Translate; className?: string }) {
    return (
        <section className={cx('py-16 sm:py-24', className)}>
            <div className="shell">
                <div className="flex flex-wrap items-center justify-between gap-8 rounded-band bg-primary px-6 py-12 text-on-primary sm:px-8 sm:py-16" data-reveal>
                    <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
                        <h2 className="text-[1.75rem] leading-[1.35] font-extrabold sm:text-4xl lg:text-[2.5rem]">{t('cta_band.title')}</h2>
                        <p className="text-[17px] text-on-primary-muted sm:text-lg">{t('cta_band.lead')}</p>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                        <ButtonLink href={href(locale, 'contact')} variant="white" size="xl" iconEnd={ArrowRight} className="w-full sm:w-auto">
                            {t('cta.consult')}
                        </ButtonLink>
                        <ButtonLink href={href(locale, 'contact', { service: 'other' })} variant="outline-light" size="xl" className="w-full sm:w-auto">
                            {t('cta.quote')}
                        </ButtonLink>
                    </div>
                </div>
            </div>
        </section>
    );
}
