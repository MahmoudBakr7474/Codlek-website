import type { HttpError } from '@refinedev/core';

/** The dashboard's API, on the same origin (the Vite dev server proxies it). */
export const API = '/api/admin';

/** Every write carries this header; the API refuses writes without it (a cross-site form can't add it). */
const ADMIN_HEADER = { 'X-Codlek-Admin': '1' };

type Options = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined | null>;
};

/**
 * Calls the admin API. A failure throws a Refine HttpError: the API's message
 * (already in Arabic) and, for a 422, its errors per field.
 */
export async function api<T>(path: string, { method = 'GET', body, query }: Options = {}): Promise<T> {
    const search = query
        ? new URLSearchParams(
              Object.entries(query)
                  .filter(([, v]) => v !== undefined && v !== null && v !== '')
                  .map(([k, v]) => [k, String(v)]),
          ).toString()
        : '';

    const isForm = body instanceof FormData;
    const response = await fetch(`${API}${path}${search ? `?${search}` : ''}`, {
        method,
        credentials: 'same-origin',
        headers: {
            ...ADMIN_HEADER,
            ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const error: HttpError = {
            message: data?.message ?? messageFor(response.status),
            statusCode: response.status,
            errors: data?.errors,
        };
        throw error;
    }

    return data as T;
}

function messageFor(status: number): string {
    if (status === 401) return 'لازم تسجّل دخول الأول.';
    if (status === 403) return 'مش مسموح.';
    if (status === 404) return 'العنصر ده مش موجود.';
    if (status >= 500) return 'حصلت مشكلة في السيرفر. جرّب تاني بعد شوية.';
    return 'حصلت مشكلة. جرّب تاني.';
}

/** Public URL of an uploaded file ("projects/x.webp"). */
export function uploadUrl(path: string | null | undefined): string | undefined {
    if (!path) return undefined;
    return path.startsWith('http') ? path : `/uploads/${path}`;
}
