'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/*
 * Scroll reveal for [data-reveal] blocks, and smooth in-page jumps once the page
 * and its font are in. "reveal-ready" tells the CSS this script runs, which
 * cancels its show-anyway fallback. Runs again on every client navigation, and
 * watches for blocks that stream in later.
 */
export function Reveal() {
    const pathname = usePathname();

    useEffect(() => {
        const root = document.documentElement;
        root.classList.add('reveal-ready');

        // The block a page was opened at (/services#web): shown at once, so the jump lands on its final position.
        try {
            const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
            for (let el = target?.closest<HTMLElement>('[data-reveal]'); el; el = el.parentElement?.closest<HTMLElement>('[data-reveal]')) {
                el.classList.add('is-visible');
                el.style.animation = 'none';
            }
        } catch {
            /* a malformed #fragment */
        }

        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                }
            },
            { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
        );

        const watch = () => document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((el) => observer.observe(el));
        watch();
        const mutations = new MutationObserver(watch);
        mutations.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            mutations.disconnect();
        };
    }, [pathname]);

    useEffect(() => {
        const on = () => document.documentElement.classList.add('smooth-scroll');
        const afterFonts = () => document.fonts.ready.then(on, on);
        if (document.readyState === 'complete') afterFonts();
        else window.addEventListener('load', afterFonts, { once: true });
    }, []);

    return null;
}
