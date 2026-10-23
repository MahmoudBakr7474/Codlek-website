'use client';

import { useEffect, useRef } from 'react';

/**
 * A row of pills that scrolls sideways on phones: brings the current one
 * ([aria-current]) into the middle of the row once the font is in.
 */
export function CurrentInView({ className, children }: { className?: string; children: React.ReactNode }) {
    const row = useRef<HTMLUListElement>(null);

    useEffect(() => {
        document.fonts.ready.then(() => {
            const el = row.current;
            const current = el?.querySelector('[aria-current]');
            if (!el || !current || el.scrollWidth <= el.clientWidth) return;
            const pill = current.getBoundingClientRect();
            const box = el.getBoundingClientRect();
            el.scrollBy({ left: pill.left + pill.width / 2 - (box.left + box.width / 2) });
        });
    }, []);

    return (
        <ul ref={row} className={className}>
            {children}
        </ul>
    );
}
