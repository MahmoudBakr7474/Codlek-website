/* eslint-disable @next/next/no-img-element -- service illustrations come from the API host */
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ServiceData } from '@/lib/api';
import { href, type Locale, type Translate } from '@/lib/i18n';
import { cx } from '@/lib/cx';
import { NamedIconTile } from '../ui/NamedIconTile';
import { PopularBadge } from '../ui/PopularBadge';
import { SectionHeader } from '../ui/SectionHeader';

/*
 * Service cards. Each card is one link: "request this service" opens the contact
 * form with the service already chosen. Phones: one row that scrolls sideways with
 * the next card peeking in, instead of a column several screens long. From `sm` a
 * grid: a multiple of four goes 2 then 4 across (never 3 + 3 + 2), other counts
 * fill the rows as the design does.
 */
export function Services({ services, locale, t, white }: { services: ServiceData[]; locale: Locale; t: Translate; white: boolean }) {
    const swipe = services.length > 1;
    // Non-overlapping ranges: Tailwind sorts min-[…] before sm:, so an open-ended sm: would win.
    const columns =
        services.length % 4 === 0 ? 'sm:max-[1159.98px]:grid-cols-2 min-[1160px]:grid-cols-4' : 'sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]';

    return (
        <section id="services" className={cx('py-16 sm:py-24', white && 'border-y border-line bg-surface')}>
            <div className="shell flex flex-col gap-10 sm:gap-12">
                <SectionHeader eyebrow={t('home.services.eyebrow')} title={t('home.services.title')} lead={t('home.services.lead')} />

                <div
                    className={cx(
                        'sm:grid sm:gap-6',
                        columns,
                        swipe
                            ? '-mx-4 -my-2 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:m-0 sm:snap-none sm:overflow-visible sm:p-0 [&::-webkit-scrollbar]:hidden'
                            : 'grid gap-6',
                    )}
                >
                    {services.map((service, i) => (
                        <article
                            key={service.key}
                            className={cx(
                                'group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary-line hover:shadow-float has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-[3px] has-[a:focus-visible]:outline-primary-ink',
                                swipe && 'w-[82%] shrink-0 snap-start sm:w-auto',
                            )}
                            data-reveal
                            style={{ '--reveal-delay': `${(i % 4) * 70}ms` } as React.CSSProperties}
                        >
                            {/* Phones: a shorter picture, so the swipe row stays one screen tall. */}
                            <div className="relative aspect-[2/1] border-b border-line bg-surface-sunken sm:aspect-[3/2]">
                                {service.imageUrl ? (
                                    <img src={service.imageUrl} alt="" width={1200} height={800} loading="lazy" decoding="async" className="shot size-full object-cover" />
                                ) : (
                                    <div className="grid size-full place-items-center">
                                        <NamedIconTile icon={service.icon} tone={service.tone} size="lg" />
                                    </div>
                                )}
                                {service.popular && <PopularBadge>{t('home.services.popular')}</PopularBadge>}
                            </div>

                            <div className="flex flex-1 flex-col gap-2.5 p-[22px] pb-6">
                                <div className="flex items-center gap-3">
                                    <NamedIconTile icon={service.icon} tone={service.tone} />
                                    <h3 className="min-w-0 text-xl leading-[1.4] font-extrabold">{service.title}</h3>
                                </div>
                                <p className="flex-1 text-[15px] text-ink-muted">{service.summary}</p>
                                <Link
                                    href={href(locale, 'contact', { service: service.key })}
                                    className="inline-flex w-fit items-center gap-1.5 text-[15px] font-bold text-primary-ink outline-none after:absolute after:inset-0 after:rounded-card"
                                >
                                    <span>
                                        {t('home.services.request')}
                                        <span className="sr-only"> — {service.title}</span>
                                    </span>
                                    <ArrowRight
                                        className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
