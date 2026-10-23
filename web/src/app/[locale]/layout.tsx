import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import { Footer } from '@/components/layout/Footer';
import { FloatingContact, type QuickLink } from '@/components/layout/FloatingContact';
import { Header } from '@/components/layout/Header';
import { PageLoader } from '@/components/layout/PageLoader';
import { Reveal } from '@/components/layout/Reveal';
import { themeScript } from '@/components/layout/theme-script';
import { getSite } from '@/lib/api';
import { isLocale, locales, translator, type Locale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';
import { SITE_URL, absolute } from '@/lib/site-url';
import '../globals.css';

/* Cairo (variable) for both languages, self-hosted and preloaded by next/font. */
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', display: 'swap' });

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: '#FFFFFF' };

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
    const locale = localeOf((await params).locale);
    const site = await getSite(locale);

    return {
        metadataBase: new URL(SITE_URL),
        ...pageMetadata({ locale, site, path: 'home' }),
        // The SVG icon stays sharp at any size; browsers without SVG icons take the .ico.
        icons: {
            icon: [
                { url: '/favicon.ico', sizes: '32x32' },
                { url: '/images/brand/favicon.svg', type: 'image/svg+xml' },
            ],
            apple: '/images/brand/apple-touch-icon.png',
        },
        manifest: '/site.webmanifest',
    };
}

function localeOf(value: string): Locale {
    return isLocale(value) ? value : 'ar';
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
    const locale = localeOf((await params).locale);
    const site = await getSite(locale);
    const t = translator(site.texts);

    const quickLinks: QuickLink[] = [
        { href: `https://wa.me/${site.contact.whatsapp}`, label: t('social.whatsapp'), kind: 'whatsapp' },
        { href: `tel:${site.contact.phoneInternational}`, label: t('floating.call'), kind: 'phone' },
        // The social accounts set in the admin, in the owner's order.
        ...site.socials.map((social) => ({ href: social.url, label: social.label, kind: social.platform })),
    ];

    const organization = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Codlek',
        url: absolute('/'),
        logo: absolute('/images/brand/codlek-logo.png'),
        description: t('meta.default_description', { founded: site.founded }),
        foundingDate: String(site.founded),
        address: { '@type': 'PostalAddress', addressCountry: 'EG' },
        contactPoint: {
            '@type': 'ContactPoint',
            email: site.contact.email,
            telephone: site.contact.phoneInternational,
            contactType: 'customer service',
            availableLanguage: ['Arabic', 'English'],
        },
        sameAs: site.socials.map((social) => social.url),
    };

    return (
        // The <head> script adds .js and .dark before React hydrates.
        <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className={cairo.variable} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript(site.appearance.theme) }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, '\\u003c') }} />
            </head>
            <body className="flex min-h-dvh flex-col">
                {/* Logo loader: first thing in <body>, so it covers the page from the first paint. */}
                <PageLoader mode={site.appearance.loader} />

                <a
                    href="#main"
                    className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-btn focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-on-primary focus:shadow-float"
                >
                    {t('skip')}
                </a>

                {/* The design's three-colour brand strip (blue / teal / magenta). */}
                <div className="brand-strip w-full shrink-0" aria-hidden="true" />

                <Header
                    locale={locale}
                    labels={{
                        nav: Object.fromEntries(['home', 'about', 'services', 'projects', 'blog', 'careers', 'contact'].map((page) => [page, t(`nav.${page}`)])),
                        navLabel: t('nav.label'),
                        open: t('nav.open'),
                        close: t('nav.close'),
                        theme: t('theme.toggle'),
                        langSwitch: t('lang.switch'),
                        langSwitchLabel: t('lang.switch_label'),
                        startProject: t('cta.start_project'),
                        home: `${t('brand')} — ${t('nav.home')}`,
                    }}
                />

                {/* tabindex: the skip link and the toast's close button can move focus here. */}
                <main id="main" tabIndex={-1} className="flex-1 outline-none">
                    {children}
                </main>

                <Footer locale={locale} t={t} site={site} />
                {site.appearance.floatingContact && <FloatingContact links={quickLinks} toggleLabel={t('floating.toggle')} />}
                <Reveal />
            </body>
        </html>
    );
}
