import { cx } from '@/lib/cx';

/** The three dots of the browser-window frames around project screenshots, in the palette's grey. */
export function BrowserDots({ size = 'size-2' }: { size?: string }) {
    return (
        <>
            {[0, 1, 2].map((dot) => (
                <span key={dot} className={cx('shrink-0 rounded-full bg-dot', size)} />
            ))}
        </>
    );
}
