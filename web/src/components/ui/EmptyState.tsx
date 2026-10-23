import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';
import { IconTile } from './IconTile';

/** The empty projects / blog / jobs list. */
export function EmptyState({ icon, text, className }: { icon: LucideIcon; text: string; className?: string }) {
    return (
        <div className={cx('flex flex-col items-center gap-4 rounded-card border border-dashed border-line-strong bg-surface px-6 py-14 text-center sm:py-16', className)} data-reveal>
            <IconTile icon={icon} size="lg" />
            <p className="max-w-md text-lg text-ink-muted">{text}</p>
        </div>
    );
}
