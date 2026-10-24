import { ArrowRight } from 'lucide-react';
import type { Schemas } from '@/lib/api';
import { href, type Locale, type Translate } from '@/lib/i18n';
import { cx } from '@/lib/cx';
import { ButtonLink } from '../ui/Button';
import { Eyebrow } from '../ui/Eyebrow';
import { NamedIconTile } from '../ui/NamedIconTile';

/** "Why Codlek": selling points beside a panel with the years of experience and the stats. */
export function Why({ why, years, locale, t, white }: { why: Schemas['Why']; years: number; locale: Locale; t: Translate; white: boolean }) {
    const count = why.stats.length;
    const statColumns = count === 1 ? 'grid-cols-1' : count === 2 || count === 4 ? 'grid-cols-2' : 'grid-cols-3';

    return (
        <section id="about" className={cx('py-16 sm:py-24', white && 'border-y border-line bg-surface')}>
            <div className="shell grid items-center gap-12 lg:grid-cols-[minmax(0,592fr)_minmax(0,552fr)] lg:gap-14">
                <div className="flex min-w-0 flex-col gap-5" data-reveal>
                    <Eyebrow>{t('home.why.eyebrow')}</Eyebrow>

                    <h2 className="text-[1.875rem] leading-[1.35] font-extrabold sm:text-4xl lg:text-[2.5rem]">
                        {t('home.why.title_1')}
                        <span className="block text-secondary">{t('home.why.title_2')}</span>
                    </h2>

                    <p className="text-[17px] text-ink-muted sm:text-lg">{t('home.why.lead')}</p>

                    {why.features.length > 0 && (
                        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-3">
                            {why.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4">
                                    <NamedIconTile icon={feature.icon} />
                                    <span className="min-w-0 text-base leading-[1.5] font-bold text-ink">{feature.text}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <ButtonLink href={href(locale, 'about')} variant="outline" iconEnd={ArrowRight} className="self-start">
                        {t('cta.about_more')}
                    </ButtonLink>
                </div>

                <div
                    className="flex min-w-0 flex-col gap-5 rounded-panel border border-line bg-surface p-5 shadow-panel sm:p-7"
                    data-reveal
                    style={{ '--reveal-delay': '100ms' } as React.CSSProperties}
                >
                    <div className="flex flex-col items-center gap-1.5 rounded-[20px] bg-navy px-6 py-9 text-center text-white">
                        <p className="text-[3.5rem] leading-[1.1] font-extrabold text-navy-glow sm:text-[72px]">
                            <bdi dir="ltr">{years}+</bdi>
                        </p>
                        <p className="text-xl leading-[1.7] font-extrabold">{t('home.why.years_title')}</p>
                        <p className="text-[15px] text-navy-muted">{t('home.why.years_text')}</p>
                    </div>

                    {count > 0 && (
                        <ul className={cx('grid gap-3', statColumns)}>
                            {why.stats.map((stat, i) => (
                                <li key={i} className="min-w-0 rounded-2xl bg-bg px-2 py-4 text-center">
                                    <p className="text-[1.625rem] font-extrabold text-primary-ink sm:text-[28px]">
                                        <bdi dir="ltr">{stat.value}</bdi>
                                    </p>
                                    <p className="text-sm font-semibold text-ink-muted">{stat.label}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}
