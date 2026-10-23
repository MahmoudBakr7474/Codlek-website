import type { Schemas } from '@/lib/api';
import type { Translate } from '@/lib/i18n';
import { cx } from '@/lib/cx';
import { NamedIconTile } from '../ui/NamedIconTile';
import { SectionHeader } from '../ui/SectionHeader';

/*
 * Industries served. A multiple of four never leaves a half-empty last row: two
 * per row on phones (as the design's compact cards), two across, then four once
 * each card gets the design's 250px. Other counts fill the rows as the design does.
 */
export function Industries({ industries, t, white }: { industries: Schemas['IconCard'][]; t: Translate; white: boolean }) {
    const columns = industries.length % 4 === 0 ? 'grid-cols-2 min-[1096px]:grid-cols-4' : 'grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))]';

    return (
        <section className={cx('py-16 sm:py-24', white && 'border-y border-line bg-surface')}>
            <div className="shell flex flex-col gap-10 sm:gap-12">
                <SectionHeader eyebrow={t('home.industries.eyebrow')} title={t('home.industries.title')} lead={t('home.industries.lead')} />

                <ul className={cx('grid gap-3 sm:gap-4', columns)}>
                    {industries.map((industry, i) => (
                        <li
                            key={i}
                            className="flex flex-col items-start gap-3 rounded-box border border-line bg-surface p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
                            data-reveal
                            style={{ '--reveal-delay': `${(i % 4) * 60}ms` } as React.CSSProperties}
                        >
                            <NamedIconTile icon={industry.icon} tone="muted" size="lg" stroke={1.8} />
                            <div className="min-w-0">
                                <h3 className="text-[17px] leading-[1.4] font-extrabold">{industry.title}</h3>
                                <p className="text-sm text-ink-muted">{industry.text}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
