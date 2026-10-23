import type { Texts } from '@/lib/i18n';

/** Only the texts the client-side forms show (not all 192 lines). */
export function formTexts(texts: Texts): Texts {
    return Object.fromEntries(Object.entries(texts).filter(([key]) => key.startsWith('forms.') || key === 'careers.general' || key === 'close'));
}
