import type { AuthProvider, HttpError } from '@refinedev/core';
import { api } from '../lib/http';

export type Identity = { name: string; email: string };

/** Cookie sign-in: the API sets an httpOnly cookie; /auth/me says who is signed in. */
export const authProvider: AuthProvider = {
    login: async ({ email, password, remember }) => {
        try {
            await api('/auth/login', { method: 'POST', body: { email, password, remember: Boolean(remember) } });
            return { success: true, redirectTo: '/' };
        } catch (error) {
            return { success: false, error: { name: 'تسجيل الدخول', message: (error as HttpError).message } };
        }
    },

    logout: async () => {
        await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
        return { success: true, redirectTo: '/login' };
    },

    check: async () => {
        try {
            await api<Identity>('/auth/me');
            return { authenticated: true };
        } catch {
            return { authenticated: false, redirectTo: '/login', logout: true };
        }
    },

    getIdentity: async () => {
        try {
            return await api<Identity>('/auth/me');
        } catch {
            return null;
        }
    },

    onError: async (error) => ((error as HttpError)?.statusCode === 401 ? { logout: true, redirectTo: '/login' } : {}),
};
