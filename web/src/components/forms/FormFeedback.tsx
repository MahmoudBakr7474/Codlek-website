'use client';

import { useEffect, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

/*
 * The summary above a form with errors. It takes focus when it appears, so screen
 * readers read it (an alert already on the page is not announced); the next Tab goes
 * into the first field.
 */
export function ErrorSummary({ message }: { message: string }) {
    const box = useRef<HTMLDivElement>(null);
    useEffect(() => box.current?.focus({ preventScroll: true }), [message]);

    return (
        <div
            ref={box}
            role="alert"
            tabIndex={-1}
            className="mt-5 flex items-start gap-3 rounded-btn border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger outline-none"
        >
            <CircleAlert className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
            <p className="font-semibold">{message}</p>
        </div>
    );
}

/*
 * "Sent" message. Stays until closed. The live region is filled a moment after it
 * appears (screen readers don't announce text that is already there). Closing hands
 * focus to <main>, so the next Tab continues in the page.
 */
export function Toast({ title, text, closeLabel, onClose }: { title: string; text?: string; closeLabel: string; onClose: () => void }) {
    const [said, setSaid] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setSaid(`${title} ${text ?? ''}`.trim()), 300);
        return () => clearTimeout(timer);
    }, [title, text]);

    return (
        <div>
            <p className="sr-only" role="status">
                {said}
            </p>
            <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md sm:bottom-8">
                {/* Dark: a lighter panel with a stronger edge, so it stands off the page under it. */}
                <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-float dark:border-line-strong dark:bg-surface-muted">
                    <span className="grid size-10 shrink-0 place-items-center rounded-btn bg-secondary-soft text-secondary">
                        <CircleCheck className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                        <p className="font-bold text-ink">{title}</p>
                        {text && <p className="mt-0.5 text-sm text-ink-muted">{text}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }));
                        }}
                        className="icon-btn -m-1.5 size-11 min-w-11 shrink-0"
                        aria-label={closeLabel}
                    >
                        <X className="size-[18px]" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}
