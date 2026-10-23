'use client';

import { useEffect, useState } from 'react';

/*
 * Table of contents beside a legal page (wide screens). The section being read is
 * highlighted: the last heading that has scrolled past the header, or the last one
 * at the bottom of the page. Without JS it is a plain list of links.
 */
export function Toc({ label, titles }: { label: string; titles: string[] }) {
    const [active, setActive] = useState(1);

    useEffect(() => {
        let frame = 0;
        const spy = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const heads = document.querySelectorAll('[data-toc]');
                let n = [...heads].filter((h) => h.getBoundingClientRect().top < 140).length;
                if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) n = heads.length;
                setActive(Math.max(n, 1));
            });
        };
        spy();
        window.addEventListener('scroll', spy, { passive: true });
        window.addEventListener('resize', spy, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', spy);
            window.removeEventListener('resize', spy);
        };
    }, []);

    return (
        <nav aria-label={label} className="hidden lg:sticky lg:top-24 lg:col-span-4 lg:block">
            <ol className="flex max-h-[calc(100dvh-8rem)] flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-box border border-line bg-surface p-2.5 text-[15px] font-semibold text-ink-soft shadow-card">
                {titles.map((title, i) => (
                    <li key={i}>
                        <a
                            href={`#s${i + 1}`}
                            aria-current={active === i + 1 ? 'true' : undefined}
                            className="group flex items-start gap-3 rounded-btn px-3 py-2 transition-colors hover:bg-surface-chip hover:text-ink aria-[current=true]:bg-primary-soft aria-[current=true]:text-primary-ink"
                        >
                            <span
                                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-surface-chip text-xs font-bold text-ink-muted transition-colors group-hover:bg-surface group-aria-[current=true]:bg-primary group-aria-[current=true]:text-on-primary"
                                aria-hidden="true"
                            >
                                {i + 1}
                            </span>
                            <span className="min-w-0">{title}</span>
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
