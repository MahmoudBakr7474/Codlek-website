import { PUBLIC_API_URL } from '@/lib/site-url';

export type FormResult =
    | { ok: true; title: string; text: string }
    | { ok: false; message: string; errors: Record<string, string> };

/**
 * Posts a form to the API from the browser (a CV can be larger than a Vercel
 * function accepts). 200: the success texts; 422 / 429: the API's messages, already
 * in the visitor's language, one per field.
 */
export async function submitForm(locale: string, form: 'contact' | 'careers', body: BodyInit, fallbackError: string): Promise<FormResult> {
    try {
        const response = await fetch(`${PUBLIC_API_URL}/api/public/${locale}/${form}`, {
            method: 'POST',
            body,
            headers: typeof body === 'string' ? { 'Content-Type': 'application/json' } : undefined,
        });

        const data = await response.json().catch(() => null);
        if (response.ok && data) {
            return { ok: true, title: data.title, text: data.text };
        }

        const errors: Record<string, string> = {};
        for (const [field, messages] of Object.entries((data?.errors ?? {}) as Record<string, string[]>)) {
            errors[field] = messages[0];
        }

        return { ok: false, message: errors.form ?? data?.message ?? fallbackError, errors };
    } catch {
        return { ok: false, message: fallbackError, errors: {} };
    }
}
