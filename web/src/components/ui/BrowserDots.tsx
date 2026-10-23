import { cx } from '@/lib/cx';

/** The three dots of the browser-window frames around project screenshots. */
export function BrowserDots({ size = 'size-2' }: { size?: string }) {
    return (
        <>
            {['bg-dot-red', 'bg-dot-amber', 'bg-dot-green'].map((dot) => (
                <span key={dot} className={cx('shrink-0 rounded-full', size, dot)} />
            ))}
        </>
    );
}
