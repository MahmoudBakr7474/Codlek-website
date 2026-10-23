'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { THEME_COLORS, THEME_KEY } from './theme-script';

function apply(dark: boolean) {
    document.documentElement.classList.toggle('dark', dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light);
}

function subscribe(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains('dark');

/**
 * The moon / sun button. The inline script in <head> already applied the saved
 * choice (or the admin's default) before first paint; this flips it and
 * remembers the visitor's choice. `dark` follows the class on <html>.
 */
export function useThemeToggle() {
    const dark = useSyncExternalStore(subscribe, isDark, () => false);

    // The <head> script may have run before the theme-color tag existed.
    useEffect(() => apply(isDark()), []);

    const toggle = useCallback(() => {
        const next = !isDark();
        apply(next);
        try {
            localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
        } catch {
            /* private mode: the choice just isn't remembered */
        }
    }, []);

    return { dark, toggle };
}
