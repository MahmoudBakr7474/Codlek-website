/* eslint-disable @next/next/no-img-element -- covers come from the API host */
import { cx } from '@/lib/cx';
import { LogoMark } from '../ui/Logo';

/*
 * Without a cover photo the article gets a branded placeholder: one of the design's
 * four soft tones (picked from the slug, so a grid of articles doesn't repeat one
 * tile) with the logo mark on a small white card. size="lg" for the article page.
 */
export function PostCover({ coverUrl, seed, eager = false, size = 'md', className }: { coverUrl?: string | null; seed: string; eager?: boolean; size?: 'md' | 'lg'; className?: string }) {
    if (coverUrl) {
        return (
            <img
                src={coverUrl}
                alt=""
                {...(eager ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })}
                decoding="async"
                className={cx('size-full object-cover', className)}
            />
        );
    }

    const tones = ['bg-primary-soft', 'bg-teal-soft', 'bg-accent-soft', 'bg-amber-soft'];
    const tone = tones[[...seed].reduce((sum, c) => sum + c.charCodeAt(0), 0) % tones.length];
    const [card, mark] =
        size === 'lg'
            ? ['size-20 rounded-[20px] sm:size-24 sm:rounded-3xl', 'size-10 sm:size-12']
            : ['size-16 rounded-2xl sm:size-[72px] sm:rounded-box', 'size-8 sm:size-9'];

    return (
        <div className={cx('grid size-full place-items-center', tone, className)} aria-hidden="true">
            <span className={cx('grid place-items-center border border-line bg-surface shadow-float', card)}>
                <LogoMark className={mark} />
            </span>
        </div>
    );
}
