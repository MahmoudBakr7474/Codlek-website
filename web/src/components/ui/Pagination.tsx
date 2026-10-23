import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/lib/cx';

/** 44px squares (touch targets); the current page is the solid primary one. */
export function Pagination({
    page,
    lastPage,
    url,
    label,
    previous,
    next,
}: {
    page: number;
    lastPage: number;
    url: (page: number) => string;
    label: string;
    previous: string;
    next: string;
}) {
    if (lastPage <= 1) {
        return null;
    }

    const item = 'grid h-11 min-w-11 place-items-center rounded-btn px-3 text-[15px] font-bold transition-colors';
    const link = cx(item, 'border border-line bg-surface text-ink-soft hover:border-primary hover:text-primary-ink');
    const off = cx(item, 'border border-line/60 text-ink-subtle opacity-60');

    // All pages up to 7; beyond that the first, the last and the current one with its neighbours.
    const numbers: Array<number | '…'> = [];
    for (let n = 1; n <= lastPage; n++) {
        if (lastPage <= 7 || n === 1 || n === lastPage || Math.abs(n - page) <= 1) {
            numbers.push(n);
        } else if (numbers[numbers.length - 1] !== '…') {
            numbers.push('…');
        }
    }

    return (
        <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label={label}>
            {page > 1 ? (
                <Link href={url(page - 1)} rel="prev" className={link}>
                    <ChevronLeft className="size-[18px] rtl:-scale-x-100" aria-hidden="true" />
                    <span className="sr-only">{previous}</span>
                </Link>
            ) : (
                <span className={off} aria-disabled="true">
                    <ChevronLeft className="size-[18px] rtl:-scale-x-100" aria-hidden="true" />
                    <span className="sr-only">{previous}</span>
                </span>
            )}

            {numbers.map((n, i) =>
                n === '…' ? (
                    <span key={`gap-${i}`} className={cx(item, 'text-ink-subtle')} dir="ltr">
                        …
                    </span>
                ) : n === page ? (
                    <span key={n} className={cx(item, 'bg-primary text-on-primary')} aria-current="page">
                        {n}
                    </span>
                ) : (
                    <Link key={n} href={url(n)} className={link}>
                        {n}
                    </Link>
                ),
            )}

            {page < lastPage ? (
                <Link href={url(page + 1)} rel="next" className={link}>
                    <ChevronRight className="size-[18px] rtl:-scale-x-100" aria-hidden="true" />
                    <span className="sr-only">{next}</span>
                </Link>
            ) : (
                <span className={off} aria-disabled="true">
                    <ChevronRight className="size-[18px] rtl:-scale-x-100" aria-hidden="true" />
                    <span className="sr-only">{next}</span>
                </span>
            )}
        </nav>
    );
}
