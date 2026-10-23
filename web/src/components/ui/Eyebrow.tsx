import { cx } from '@/lib/cx';

/** Pill above a heading. `tone="navy"` for the pill on a navy block. */
export function Eyebrow({
    icon: Glyph,
    tone = 'primary',
    className,
    children,
}: {
    icon?: React.ComponentType<{ className?: string }>;
    tone?: 'primary' | 'navy';
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <span
            className={cx(
                'inline-flex w-fit items-center gap-2 rounded-full px-3.5 text-sm font-bold',
                Glyph ? 'py-1.5' : 'py-1',
                tone === 'navy' ? 'bg-navy-chip text-navy-chip-ink' : 'bg-primary-soft text-primary-ink',
                className,
            )}
        >
            {Glyph && <Glyph className="size-4 shrink-0" />}
            {children}
        </span>
    );
}
