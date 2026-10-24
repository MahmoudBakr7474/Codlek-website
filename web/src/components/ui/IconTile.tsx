import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';

/*
 * Square icon tile. Tones: blue (alias soft) · teal · magenta · amber · muted ·
 * solid · navy. The old names are kept (the admin stores them); on palette 8a
 * teal is the secondary blue, magenta the deep navy accent and amber the steel grey. Sizes: sm 40px · md 44px · lg 52px. `stroke`: optional stroke
 * width (the design draws industry icons at 1.8). Takes the icon component, so
 * client components can use it; for icon names from the admin use NamedIconTile.
 */

export type Tone = 'blue' | 'soft' | 'teal' | 'magenta' | 'amber' | 'muted' | 'solid' | 'navy';
export type TileSize = 'sm' | 'md' | 'lg';

const tones: Record<Tone, string> = {
    blue: 'bg-primary-soft text-primary-ink',
    soft: 'bg-primary-soft text-primary-ink',
    teal: 'bg-secondary-soft text-secondary',
    magenta: 'bg-accent-soft text-accent-ink',
    amber: 'bg-steel-soft text-steel',
    muted: 'bg-surface-chip text-ink',
    solid: 'bg-primary text-on-primary',
    navy: 'bg-navy-chip text-navy-glow',
};

const sizes: Record<TileSize, [string, string]> = {
    sm: ['size-10 rounded-btn', 'size-[18px]'],
    md: ['size-11 rounded-btn', 'size-[22px]'],
    lg: ['size-[52px] rounded-btn-lg', 'size-6'],
};

type Props = {
    icon: LucideIcon;
    tone?: Tone | string;
    size?: TileSize;
    stroke?: number;
    className?: string;
};

export function IconTile({ icon: Glyph, tone = 'blue', size = 'md', stroke, className }: Props) {
    const [box, glyph] = sizes[size];
    return (
        <span className={cx('grid shrink-0 place-items-center transition-colors duration-300', box, tones[tone as Tone] ?? tones.blue, className)} aria-hidden="true">
            <Glyph className={glyph} strokeWidth={stroke} />
        </span>
    );
}
