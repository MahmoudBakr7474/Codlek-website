export type Lang = 'ar' | 'en';

/** " (English)" after an English field's label. */
export const suffix = (lang: Lang) => (lang === 'en' ? ' (English)' : '');

/** English is typed left-to-right. */
export const dirFor = (lang: Lang) => (lang === 'en' ? 'ltr' : 'rtl');

/** The Arabic text of an {ar, en} pair, for list item titles. */
export function pairLabel(value: unknown, fallback = ''): string {
    if (value && typeof value === 'object') {
        const pair = value as { ar?: string; en?: string };
        return pair.ar || pair.en || fallback;
    }

    return fallback;
}
