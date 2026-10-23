import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CalendarCheck, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { ContactForm } from '@/components/forms/ContactForm';
import { formTexts } from '@/components/forms/form-texts';
import { SocialIcon, WhatsAppIcon } from '@/components/ui/BrandIcons';
import { ButtonLink } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/IconTile';
import { PageHero } from '@/components/ui/PageHero';
import { href } from '@/lib/i18n';
import { pageContext } from '@/lib/page';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
    const { locale, site, t } = await pageContext(params);
    return pageMetadata({ locale, site, path: 'contact', title: t('contact.hero.title'), description: t('contact.hero.lead') });
}

export default async function ContactPage({ params, searchParams }: PageProps<'/[locale]/contact'>) {
    const { locale, site, t } = await pageContext(params);
    const texts = formTexts(site.texts);
    const form = (preselected?: string) => (
        <ContactForm locale={locale} texts={texts} services={site.serviceOptions} preselected={preselected} privacyHref={href(locale, 'privacy')} />
    );

    // Contact rows: the whole card is the link (mail / call); the location is plain text.
    const row = 'flex items-center gap-4 rounded-box border border-line bg-surface p-4 shadow-card sm:p-5';

    return (
        <>
            <PageHero locale={locale} t={t} eyebrow={t('contact.hero.eyebrow')} title={t('contact.hero.title')} lead={t('contact.hero.lead')} />

            <section className="py-16 sm:py-24">
                <div className="shell grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
                    <div id="contact-form" className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-8 lg:col-span-7 lg:p-10 xl:col-span-8">
                        <div className="flex items-start gap-4">
                            <IconTile icon={CalendarCheck} size="lg" />
                            <div className="min-w-0">
                                <h2 className="text-[1.375rem] font-extrabold sm:text-[1.75rem]">{t('contact.form_title')}</h2>
                                <p className="mt-1 text-[15px] text-ink-muted sm:text-base">{t('contact.form_lead')}</p>
                            </div>
                        </div>

                        {/* ?service=web (the "request this service" links) picks the service. */}
                        <Suspense fallback={form()}>
                            {searchParams.then(({ service }) => form(typeof service === 'string' && site.serviceOptions.some((option) => option.key === service) ? service : undefined))}
                        </Suspense>
                    </div>

                    {/* Direct contact: two columns on tablets (contact rows | WhatsApp + accounts), one beside the form. */}
                    <aside className="grid min-w-0 items-start gap-4 md:grid-cols-2 lg:col-span-5 lg:grid-cols-1 xl:col-span-4">
                        <ul className="flex min-w-0 flex-col gap-3">
                            <li>
                                <a href={`mailto:${site.contact.email}`} className={`group ${row} transition-colors duration-200 hover:border-primary-line`}>
                                    <IconTile icon={Mail} />
                                    <span className="min-w-0">
                                        <span className="block text-sm text-ink-muted">{t('contact.email')}</span>
                                        <span className="block truncate font-bold text-ink transition-colors group-hover:text-primary-ink rtl:text-right" dir="ltr">
                                            {site.contact.email}
                                        </span>
                                    </span>
                                </a>
                            </li>
                            <li>
                                <a href={`tel:${site.contact.phoneInternational}`} className={`group ${row} transition-colors duration-200 hover:border-primary-line`}>
                                    <IconTile icon={Phone} />
                                    <span className="min-w-0">
                                        <span className="block text-sm text-ink-muted">{t('contact.phone')}</span>
                                        <span className="block font-bold text-ink transition-colors group-hover:text-primary-ink rtl:text-right" dir="ltr">
                                            {site.contact.phone}
                                        </span>
                                    </span>
                                </a>
                            </li>
                            <li className={row}>
                                <IconTile icon={MapPin} />
                                <span className="min-w-0">
                                    <span className="block text-sm text-ink-muted">{t('contact.location')}</span>
                                    <span className="block font-bold text-ink">{t('contact.location_value')}</span>
                                </span>
                            </li>
                        </ul>

                        <div className="flex min-w-0 flex-col gap-4">
                            {/* WhatsApp: the one navy emphasis block on the page. */}
                            <div className="rounded-card border border-navy-line bg-navy p-6 text-white sm:p-7">
                                <div className="flex items-center gap-3">
                                    <IconTile icon={MessageCircle} tone="navy" />
                                    <h2 className="text-lg font-extrabold">{t('contact.whatsapp_title')}</h2>
                                </div>
                                <p className="mt-3 text-[15px] text-navy-muted">{t('contact.whatsapp_text')}</p>
                                <ButtonLink href={`https://wa.me/${site.contact.whatsapp}`} external variant="whatsapp" icon={WhatsAppIcon} className="mt-5 w-full focus-visible:outline-white">
                                    {t('contact.whatsapp_button')}
                                </ButtonLink>
                            </div>

                            {site.socials.length > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-box border border-line bg-surface p-4 shadow-card sm:p-5">
                                    <h2 className="text-base font-extrabold">{t('contact.follow')}</h2>
                                    <ul className="flex flex-wrap gap-2">
                                        {site.socials.map((social) => (
                                            <li key={social.url}>
                                                <a
                                                    href={social.url}
                                                    target="_blank"
                                                    rel="noopener"
                                                    aria-label={social.label}
                                                    className="grid size-11 place-items-center rounded-btn border border-line bg-surface text-ink-soft transition-colors hover:border-primary-line hover:bg-primary-soft hover:text-primary-ink"
                                                >
                                                    <SocialIcon platform={social.platform} className="size-[18px]" />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </section>
        </>
    );
}
