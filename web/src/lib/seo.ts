import type { Metadata } from 'next';
import type { SiteData } from './api';
import { href, translator, type Locale, type Page } from './i18n';
import { absolute } from './site-url';

type PageMeta = {
    locale: Locale;
    site: SiteData;
    /** The page's own title; the brand is appended. Without one: the site's default title. */
    title?: string;
    description?: string | null;
    /** A page key or a path ("/blog/slug"), the same in both languages. */
    path: Page | string;
    /** Query kept in the canonical URL (the blog's page number). */
    query?: Record<string, string | number | undefined>;
    image?: string | null;
    type?: 'website' | 'article';
    noindex?: boolean;
};

/**
 * Title, description, canonical + hreflang (ar, en, x-default = ar), Open Graph
 * and Twitter tags, as the Laravel layout wrote them.
 */
export function pageMetadata({ locale, site, title, description, path, query, image, type = 'website', noindex = false }: PageMeta): Metadata {
    const t = translator(site.texts);
    const fullTitle = title ? `${title} | ${t('brand')}` : t('meta.default_title');
    const text = description || t('meta.default_description', { founded: site.founded });
    const ogImage = image || site.ogImageUrl || absolute('/images/og-cover.png');
    const url = (l: Locale) => absolute(href(l, path, query));

    return {
        title: { absolute: fullTitle },
        description: text,
        keywords: t('meta.keywords'),
        robots: noindex ? { index: false, follow: true } : undefined,
        alternates: noindex
            ? undefined
            : {
                  canonical: url(locale),
                  languages: { ar: url('ar'), en: url('en'), 'x-default': url('ar') },
              },
        openGraph: {
            siteName: 'Codlek',
            type,
            title: fullTitle,
            description: text,
            url: url(locale),
            images: [ogImage],
            locale: locale === 'ar' ? 'ar_EG' : 'en_US',
            alternateLocale: locale === 'ar' ? 'en_US' : 'ar_EG',
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description: text,
            images: [ogImage],
        },
    };
}
