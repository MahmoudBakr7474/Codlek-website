/*
 * Arabic is served at "/" and English under "/en" (src/proxy.ts rewrites the
 * Arabic URLs to /ar/... inside the app). Texts come from the API: the shipped
 * UI texts with the owner's edits laid over them.
 */

export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: unknown): value is Locale {
    return value === 'ar' || value === 'en';
}

export const pages = {
    home: '',
    about: '/about',
    services: '/services',
    projects: '/projects',
    blog: '/blog',
    careers: '/careers',
    contact: '/contact',
    privacy: '/privacy',
    terms: '/terms',
} as const;

export type Page = keyof typeof pages;

/** Path of a page in a language, with an optional query and #fragment. */
export function href(locale: Locale, page: Page | string, query?: Record<string, string | number | undefined>, hash?: string): string {
    const path = page in pages ? pages[page as Page] : page;
    const prefixed = locale === 'en' ? `/en${path}` : path || '/';
    const search = query
        ? new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string | number] => entry[1] !== undefined).map(([k, v]) => [k, String(v)])).toString()
        : '';
    return prefixed + (search ? `?${search}` : '') + (hash ? `#${hash}` : '');
}

export function postHref(locale: Locale, slug: string): string {
    return href(locale, `/blog/${encodeURIComponent(slug)}`);
}

export type Texts = Record<string, string>;
export type Translate = (key: string, replace?: Record<string, string | number>) => string;

/** t('site.key', { name: 'x' }): the text with Laravel-style ":name" placeholders filled. */
export function translator(texts: Texts): Translate {
    return (key, replace) => fill(texts[key] ?? key, replace);
}

function fill(text: string, replace?: Record<string, string | number>): string {
    if (!replace) {
        return text;
    }

    return Object.keys(replace)
        .sort((a, b) => b.length - a.length)
        .reduce((result, name) => result.split(`:${name}`).join(String(replace[name])), text);
}

/**
 * Laravel's trans_choice: "{0} No projects|{1} 1 project|[2,*] :count projects".
 * Segments with {n} or [min,max] ranges are matched first; plain segments fall
 * back to singular / plural.
 */
export function choice(text: string, count: number, replace?: Record<string, string | number>): string {
    const segments = text.split('|');
    const values = { count, ...replace };

    for (const segment of segments) {
        const exact = segment.match(/^\s*\{(\d+)\}\s*([\s\S]*)$/);
        if (exact && Number(exact[1]) === count) {
            return fill(exact[2], values);
        }

        const range = segment.match(/^\s*\[(\d+|\*),\s*(\d+|\*)\]\s*([\s\S]*)$/);
        if (range) {
            const min = range[1] === '*' ? -Infinity : Number(range[1]);
            const max = range[2] === '*' ? Infinity : Number(range[2]);
            if (count >= min && count <= max) {
                return fill(range[3], values);
            }
        }
    }

    const plain = segments.filter((s) => !/^\s*(\{\d+\}|\[(\d+|\*),\s*(\d+|\*)\])/.test(s));
    const pick = plain.length > 1 && count !== 1 ? plain[1] : plain[0] ?? segments[segments.length - 1];
    return fill(pick.replace(/^\s*(\{\d+\}|\[[^\]]*\])\s*/, ''), values);
}

/** "22 September 2026" / "22 سبتمبر 2026" (Western digits, as the Laravel site). */
export function formatDate(iso: string, locale: Locale): string {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Africa/Cairo',
    }).format(new Date(iso));
}

export function isoDate(iso: string): string {
    return new Date(iso).toISOString().slice(0, 10);
}

/**
 * A text written wholly in the other script (an English description typed into
 * the Arabic field, or the Arabic one /en falls back to) runs in its own
 * direction, so its punctuation stays at its end.
 */
export function dirOf(text: string, locale: Locale): 'ltr' | 'rtl' | undefined {
    const latin = /\p{Script=Latin}/u.test(text);
    const arabic = /\p{Script=Arabic}/u.test(text);
    if (locale === 'ar' && latin && !arabic) return 'ltr';
    if (locale === 'en' && arabic && !latin) return 'rtl';
    return undefined;
}

/** The text-align to keep the page's alignment on a block that got its own dir. */
export function alignFor(locale: Locale): string {
    return locale === 'ar' ? 'text-right' : 'text-left';
}
