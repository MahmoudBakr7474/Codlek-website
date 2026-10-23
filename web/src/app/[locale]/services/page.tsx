/* eslint-disable @next/next/no-img-element -- service illustrations come from the API host */
import type { Metadata } from 'next';
import { ArrowRight, Check } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { CtaBand } from '@/components/ui/CtaBand';
import { Icon } from '@/components/ui/Icon';
import { NamedIconTile } from '@/components/ui/NamedIconTile';
import { PageHero } from '@/components/ui/PageHero';
import { PopularBadge } from '@/components/ui/PopularBadge';
import { getServices } from '@/lib/api';
import { cx } from '@/lib/cx';
import { href } from '@/lib/i18n';
import { pageContext } from '@/lib/page';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps<'/[locale]/services'>): Promise<Metadata> {
    const { locale, site, t } = await pageContext(params);
    return pageMetadata({ locale, site, path: 'services', title: t('services.hero.title'), description: t('services.hero.lead') });
}

/** The small round icon in each jump link takes the service's tile colour. */
const chipTones: Record<string, string> = {
    blue: 'bg-primary-soft text-primary-ink',
    teal: 'bg-teal-soft text-teal',
    magenta: 'bg-accent-soft text-accent-ink',
    amber: 'bg-amber-soft text-amber-ink',
};

/*
 * Jump links to each service use the projects filter's pills: one row that scrolls
 * sideways on phones, wrapping from `sm`. Then a card per service: the illustration in
 * a sunken well beside the text, sides swapping row by row.
 */
export default async function ServicesPage({ params }: PageProps<'/[locale]/services'>) {
    const { locale, t } = await pageContext(params);
    const services = await getServices(locale);

    return (
        <>
            <PageHero locale={locale} t={t} eyebrow={t('services.hero.eyebrow')} title={t('services.hero.title')} lead={t('services.hero.lead')}>
                {services.length > 1 && (
                    <div className="-mx-4 mt-8 sm:mx-0 sm:mt-10">
                        <ul className="-my-1.5 flex gap-2.5 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
                            {services.map((service) => (
                                <li key={service.key} className="shrink-0">
                                    <a
                                        href={`#${service.key}`}
                                        className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface ps-1.5 pe-4 text-[15px] font-semibold whitespace-nowrap text-ink-soft shadow-xs transition-colors duration-200 hover:border-primary-line hover:text-primary-ink"
                                    >
                                        <span className={cx('grid size-8 shrink-0 place-items-center rounded-full', chipTones[service.tone] ?? chipTones.blue)}>
                                            <Icon name={service.icon} fallback="layout-grid" className="size-4" />
                                        </span>
                                        {service.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </PageHero>

            {services.length > 0 && (
                <section className="py-16 sm:py-24">
                    <div className="shell flex flex-col gap-8 lg:gap-10">
                        {services.map((service, i) => {
                            // Even rows: text on the start side, picture on the end side; odd rows swap.
                            const flip = i % 2 === 1;
                            const description = service.description || service.summary;
                            return (
                                <article key={service.key} id={service.key} className="grid overflow-hidden rounded-card border border-line bg-surface shadow-card lg:grid-cols-2" data-reveal>
                                    {/* Decorative (alt=""): the heading beside it names the service. */}
                                    <div
                                        className={cx(
                                            'flex items-center justify-center border-b border-line bg-surface-sunken p-4 sm:p-6 lg:border-b-0 lg:p-8',
                                            flip ? 'lg:border-e' : 'lg:order-2 lg:border-s',
                                        )}
                                    >
                                        <div className="relative w-full max-w-[560px] lg:max-w-none">
                                            {service.imageUrl ? (
                                                <img
                                                    src={service.imageUrl}
                                                    alt=""
                                                    width={1200}
                                                    height={800}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="shot aspect-[3/2] w-full rounded-box border border-line bg-surface object-cover"
                                                />
                                            ) : (
                                                <div className="grid aspect-[3/2] w-full place-items-center rounded-box border border-line bg-surface">
                                                    <NamedIconTile icon={service.icon} tone={service.tone} size="lg" className="scale-150" />
                                                </div>
                                            )}
                                            {service.popular && <PopularBadge>{t('home.services.popular')}</PopularBadge>}
                                        </div>
                                    </div>

                                    <div className="flex min-w-0 flex-col p-6 sm:p-8 lg:p-10">
                                        <div className="flex items-center gap-4">
                                            <NamedIconTile icon={service.icon} tone={service.tone} size="lg" />
                                            <h2 className="text-2xl font-extrabold sm:text-[1.75rem]">{service.title}</h2>
                                        </div>

                                        {description !== '' && <p className="mt-5 text-base text-ink-muted sm:text-[17px]">{description}</p>}

                                        {service.features.length > 0 && (
                                            <ul className="mt-6 grid gap-x-6 gap-y-3 border-t border-line pt-6 sm:grid-cols-2">
                                                {service.features.map((feature, f) => (
                                                    <li key={f} className="flex items-start gap-2.5">
                                                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-teal-soft text-teal">
                                                            <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                                                        </span>
                                                        <span className="text-[15px] font-semibold text-ink-soft sm:text-base">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <div className="mt-8">
                                            <ButtonLink href={href(locale, 'contact', { service: service.key })} iconEnd={ArrowRight} className="w-full sm:w-auto">
                                                {t('services.quote')}
                                            </ButtonLink>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Shares the page background with the list above. */}
            <CtaBand locale={locale} t={t} className={services.length > 0 ? 'pt-0 sm:pt-0' : undefined} />
        </>
    );
}
