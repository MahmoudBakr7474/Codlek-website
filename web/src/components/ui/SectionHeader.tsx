import { cx } from '@/lib/cx';
import { Eyebrow } from './Eyebrow';

/*
 * Section heading: pill, h2 (optional second line in the secondary blue), lead. `actions` (e.g. a
 * "view all" button) sit at the other side, bottom-aligned, and wrap under the
 * text on narrow screens. `tone="navy"` for a heading on a navy block.
 */
export function SectionHeader({
    eyebrow,
    title,
    highlight,
    lead,
    align = 'center',
    tone = 'default',
    actions,
    className,
}: {
    eyebrow?: string;
    title: string;
    highlight?: string;
    lead?: string;
    align?: 'center' | 'start';
    tone?: 'default' | 'navy';
    actions?: React.ReactNode;
    className?: string;
}) {
    const navy = tone === 'navy';
    const center = align === 'center' && !actions;
    const stack = cx('flex flex-col gap-3', center ? 'items-center text-center' : 'items-start');

    const text = (
        <>
            {eyebrow && <Eyebrow tone={navy ? 'navy' : 'primary'}>{eyebrow}</Eyebrow>}
            <h2 className={cx('max-w-4xl text-[1.875rem] leading-[1.35] font-extrabold sm:text-4xl lg:text-[2.5rem]', navy && 'text-white')}>
                {title}
                {highlight && <span className={cx('block', navy ? 'text-navy-glow' : 'text-secondary')}>{highlight}</span>}
            </h2>
            {lead && <p className={cx('max-w-[640px] text-lg', navy ? 'text-navy-muted' : 'text-ink-muted')}>{lead}</p>}
        </>
    );

    if (!actions) {
        return (
            <div className={cx(stack, className)} data-reveal>
                {text}
            </div>
        );
    }

    return (
        <div className={cx('flex flex-wrap items-end justify-between gap-5', className)} data-reveal>
            <div className={cx(stack, 'min-w-0')}>{text}</div>
            <div className="flex flex-wrap items-center gap-3">{actions}</div>
        </div>
    );
}
