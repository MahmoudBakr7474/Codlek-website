import { getSite } from './api';
import { isLocale, translator, type Locale } from './i18n';

/** The locale from a page's params (always ar or en: src/proxy.ts sees to that). */
export async function localeFrom(params: Promise<{ locale: string }>): Promise<Locale> {
    const value = (await params).locale;
    return isLocale(value) ? value : 'ar';
}

/** The page's locale, the site data and its translator, in one call. */
export async function pageContext(params: Promise<{ locale: string }>) {
    const locale = await localeFrom(params);
    const site = await getSite(locale);
    return { locale, site, t: translator(site.texts) };
}
