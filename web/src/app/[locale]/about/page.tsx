import type { Metadata } from 'next';
import { Award, Check } from 'lucide-react';
import { CtaBand } from '@/components/ui/CtaBand';
import { IconTile } from '@/components/ui/IconTile';
import { LogoMark } from '@/components/ui/Logo';
import { NamedIconTile } from '@/components/ui/NamedIconTile';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getAbout } from '@/lib/api';
import { cx } from '@/lib/cx';
import { pageContext } from '@/lib/page';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps<'/[locale]/about'>): Promise<Metadata> {
    const { locale, site, t } = await pageContext(params);
    return pageMetadata({ locale, site, path: 'about', title: t('about.hero.title'), description: t('about.hero.lead', { founded: site.founded }) });
}

/** Value cards cycle through the design's tile colours. */
const tones = ['blue', 'magenta', 'teal', 'amber'];

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
    const { locale, site, t } = await pageContext(params);
    const about = await getAbout(locale);
    const lead = t('about.hero.lead', { founded: site.founded });

    // Numbers strip: two columns on phones (an odd last number spans both), one row from `sm`.
    const stats = about.stats;
    const count = stats.length;
    const lastRowStart = count - (count % 2 || 2);

    // A percentage also fills the small meter under the satisfaction number.
    const percent = about.satisfaction.match(/^\s*(\d{1,3}(?:[.,]\d+)?)\s*%\s*$/);
    const meter = percent ? Math.min(100, parseFloat(percent[1].replace(',', '.'))) : null;

    return (
        <>
            <PageHero locale={locale} t={t} eyebrow={t('about.hero.eyebrow')} title={t('about.hero.title')} lead={lead}>
                {count > 0 && (
                    <dl
                        className={cx(
                            'mt-8 grid rounded-box border border-line bg-surface-muted sm:mt-10',
                            count === 1 ? 'max-w-60 grid-cols-1' : count === 2 ? 'grid-cols-2 sm:max-w-96' : count === 3 ? 'grid-cols-2 sm:max-w-xl sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4',
                        )}
                    >
                        {stats.map((stat, i) => (
                            <div
                                key={i}
                                className={cx(
                                    'flex min-w-0 flex-col-reverse px-4 py-3.5 sm:px-5 sm:py-4',
                                    count > 1 && count % 2 === 1 && i === count - 1 && 'col-span-2 sm:col-span-1',
                                    i % 2 === 0 && i + 1 < count && 'border-e border-line',
                                    i % 2 === 1 && i + 1 < count && 'border-line sm:border-e',
                                    i < lastRowStart && 'border-b border-line sm:border-b-0',
                                )}
                            >
                                <dt className="text-[13px] font-semibold text-ink-muted sm:text-sm">{stat.label}</dt>
                                <dd className="text-2xl leading-[1.5] font-extrabold text-ink sm:text-[1.75rem] rtl:text-right" dir="ltr">
                                    {stat.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}
            </PageHero>

            {/* Story */}
            <section className="py-16 sm:py-24">
                <div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
                    <div className="flex min-w-0 flex-col gap-5">
                        <SectionHeader align="start" eyebrow={t('about.story.eyebrow')} title={t('about.story.title')} />
                        <div className="space-y-4 text-[17px] text-ink-muted sm:text-lg" data-reveal style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
                            {about.story.map((paragraph, i) => (
                                <p key={i}>{paragraph}</p>
                            ))}
                        </div>
                    </div>

                    {/* The logo mark in the hero's image frame, with the "since" card hanging off its corner. */}
                    <figure className="relative" data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
                        <div className="grid aspect-[4/3] place-items-center rounded-panel border border-line bg-surface-sunken shadow-hero sm:aspect-[3/2]">
                            <div className="grid size-36 place-items-center rounded-[32px] border border-line bg-surface shadow-float sm:size-56 sm:rounded-[48px]">
                                <LogoMark className="size-[72px] sm:size-28" />
                            </div>
                        </div>
                        <figcaption className="absolute start-4 -bottom-[22px] flex max-w-[calc(100%_-_2rem)] items-center gap-3 rounded-2xl border border-line bg-surface px-[18px] py-3 shadow-float sm:start-6">
                            <IconTile icon={Award} tone="teal" size="sm" />
                            <span className="text-base leading-[1.4] font-extrabold">{t('about.story.since', { year: site.founded })}</span>
                        </figcaption>
                    </figure>
                </div>
            </section>

            {/* Values */}
            {about.values.length > 0 && (
                <section className="border-y border-line bg-surface py-16 sm:py-24">
                    <div className="shell">
                        <SectionHeader eyebrow={t('about.values.eyebrow')} title={t('about.values.title')} />

                        {/* Four a row (two on phones); a short last row is centred. Small cards, so the small-card radius. */}
                        <ul className="mt-12 flex flex-wrap justify-center gap-3 sm:gap-6">
                            {about.values.map((value, i) => (
                                <li
                                    key={i}
                                    className="flex w-full flex-col items-center gap-2 rounded-box border border-line bg-surface-muted px-3 py-6 text-center min-[360px]:w-[calc(50%_-_0.375rem)] sm:w-[calc(50%_-_0.75rem)] sm:px-6 sm:py-8 lg:w-[calc(25%_-_1.125rem)]"
                                    data-reveal
                                    style={{ '--reveal-delay': `${(i % 4) * 70}ms` } as React.CSSProperties}
                                >
                                    <NamedIconTile icon={value.icon} tone={tones[i % tones.length]} size="lg" className="mb-2" />
                                    <h3 className="text-base font-extrabold sm:text-[19px]">{value.title}</h3>
                                    <p className="text-sm text-ink-muted sm:text-[15px]">{value.text}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {/* What sets us apart: the list and the satisfaction card (the home "why" panel) */}
            <section className="py-16 sm:py-24">
                <div className="shell grid items-center gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
                    <div className="flex min-w-0 flex-col gap-8">
                        <SectionHeader align="start" eyebrow={t('about.why.eyebrow')} title={t('about.why.title')} />
                        {about.why.length > 0 && (
                            <ul className="grid gap-3 sm:grid-cols-2" data-reveal style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
                                {about.why.map((item, i) => (
                                    <li key={i} className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4">
                                        <IconTile icon={Check} tone="teal" size="sm" stroke={2.4} />
                                        <span className="text-[15px] leading-normal font-bold sm:text-base">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="rounded-panel border border-line bg-surface p-4 shadow-panel sm:p-7" data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
                        <div className="flex flex-col items-center gap-1.5 rounded-[20px] bg-navy px-6 py-10 text-center text-white sm:py-12">
                            <p className="text-6xl leading-[1.1] font-extrabold text-navy-glow sm:text-7xl" dir="ltr">
                                {about.satisfaction}
                            </p>
                            <p className="text-xl font-extrabold">{t('about.why.satisfaction')}</p>
                            {meter !== null && (
                                <div className="mt-5 flex h-2 w-full max-w-64 overflow-hidden rounded-full bg-navy-chip" aria-hidden="true">
                                    <span className="rounded-full bg-navy-glow" style={{ width: `${meter}%` }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Shares the page background with the section above. */}
            <CtaBand locale={locale} t={t} className="pt-0 sm:pt-0" />
        </>
    );
}
