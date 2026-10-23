import type { Schemas } from '@/lib/api';
import type { Translate } from '@/lib/i18n';
import { cx } from '@/lib/cx';
import { NamedIconTile } from '../ui/NamedIconTile';
import { SectionHeader } from '../ui/SectionHeader';

/** All steps in one row once they fit (up to seven), balanced rows below that. */
export function stepColumns(count: number): string {
    return (
        {
            1: 'grid-cols-1',
            2: 'grid-cols-2',
            3: 'grid-cols-2 md:grid-cols-3',
            4: 'grid-cols-2 md:grid-cols-4',
            5: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
            6: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
            7: 'grid-cols-2 md:grid-cols-4 xl:grid-cols-7',
        }[count] ?? 'grid-cols-2 md:grid-cols-4'
    );
}

/*
 * The project journey: numbered steps on the navy band (navy whatever its turn). In
 * dark mode the navy is close to the page background, so the band always takes
 * hairlines there. An odd last step takes the whole row on phones.
 */
export function Journey({ journey, t }: { journey: Schemas['IconCard'][]; t: Translate }) {
    return (
        <section className="bg-navy py-16 text-white sm:py-24 dark:border-y dark:border-navy-line">
            <div className="shell flex flex-col gap-10 sm:gap-12">
                <SectionHeader tone="navy" eyebrow={t('home.journey.eyebrow')} title={t('home.journey.title')} lead={t('home.journey.lead')} />

                <ol className={cx('grid gap-3 sm:gap-4', stepColumns(journey.length))}>
                    {journey.map((step, i) => (
                        <li
                            key={i}
                            className="flex flex-col gap-2.5 rounded-box border border-navy-line bg-navy-card px-[18px] py-[22px] max-md:odd:last:col-span-full"
                            data-reveal
                            style={{ '--reveal-delay': `${(i % 7) * 60}ms` } as React.CSSProperties}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <NamedIconTile icon={step.icon} tone="navy" />
                                <span className="text-[28px] font-extrabold text-navy-number" dir="ltr" aria-hidden="true">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                            </div>
                            <h3 className="text-lg leading-[1.7] font-extrabold">
                                <span className="sr-only">{t('home.journey.step', { n: i + 1 })}: </span>
                                {step.title}
                            </h3>
                            <p className="text-sm leading-[1.6] text-navy-muted">{step.text}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
