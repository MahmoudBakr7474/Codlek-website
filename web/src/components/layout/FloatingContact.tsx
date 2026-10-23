'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';
import { cx } from '@/lib/cx';
import { SocialIcon, WhatsAppIcon, socialTiles } from '../ui/BrandIcons';

/** The button shows once the visitor has scrolled this far: on the first screen it would sit on the hero's stats. */
const SHOW_AFTER = 240;

export type QuickLink = { href: string; label: string; kind: 'whatsapp' | 'phone' | string };

/*
 * Quick contact button (bottom start corner). The toggle comes first in the DOM,
 * so Tab moves from it straight into the links; flex-col-reverse puts the links
 * visually above it. Escape closes and hands focus back.
 */
export function FloatingContact({ links, toggleLabel }: { links: QuickLink[]; toggleLabel: string }) {
    const [open, setOpen] = useState(false);
    const [shown, setShown] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const toggle = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        // Shown once the visitor scrolls, or at once on a page too short to scroll that far.
        const update = () => {
            const room = document.documentElement.scrollHeight - window.innerHeight;
            setShown(window.scrollY > SHOW_AFTER || room <= SHOW_AFTER);
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });
        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
                toggle.current?.focus();
            }
        };
        const onPointer = (e: PointerEvent) => {
            if (!root.current?.contains(e.target as Node)) setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('pointerdown', onPointer);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('pointerdown', onPointer);
        };
    }, [open]);

    const visible = shown || open;

    return (
        <div
            id="floating-contact"
            ref={root}
            onBlur={(e) => {
                if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
            }}
            className={cx(
                'fixed start-4 bottom-5 z-40 flex flex-col-reverse items-start gap-3 transition duration-200 ease-out sm:start-6 sm:bottom-6',
                visible ? 'translate-y-0 opacity-100' : 'pointer-events-none invisible translate-y-2 opacity-0',
            )}
        >
            <button
                type="button"
                ref={toggle}
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls="quick-contact"
                aria-label={toggleLabel}
                className="grid size-14 place-items-center rounded-full bg-primary text-on-primary shadow-primary transition-[background-color,transform] duration-200 hover:bg-primary-hover active:scale-95"
            >
                {open ? <X className="size-6" aria-hidden="true" /> : <MessageCircle className="size-6" aria-hidden="true" />}
            </button>

            {/* Dark: a lighter panel with a stronger edge, so it stands off the cards under it. */}
            <div
                id="quick-contact"
                hidden={!open}
                className="flex min-w-56 flex-col gap-1 rounded-2xl border border-line bg-surface p-2 shadow-float dark:border-line-strong dark:bg-surface-muted"
            >
                {links.map((link) => {
                    const external = link.kind !== 'phone';
                    const tile = link.kind === 'whatsapp' ? 'bg-whatsapp text-white' : link.kind === 'phone' ? 'bg-primary text-on-primary' : socialTiles[link.kind];
                    return (
                        <a
                            key={link.href}
                            href={link.href}
                            {...(external ? { target: '_blank', rel: 'noopener' } : {})}
                            className="flex items-center gap-3 rounded-btn px-2.5 py-2 text-[15px] font-bold text-ink transition-colors hover:bg-surface-chip"
                        >
                            <span className={cx('grid size-9 shrink-0 place-items-center rounded-[10px]', tile)}>
                                {link.kind === 'whatsapp' ? (
                                    <WhatsAppIcon className="size-[18px]" />
                                ) : link.kind === 'phone' ? (
                                    <Phone className="size-[18px]" aria-hidden="true" />
                                ) : (
                                    <SocialIcon platform={link.kind} className="size-[18px]" />
                                )}
                            </span>
                            {link.label}
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
