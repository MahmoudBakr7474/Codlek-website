import type { Schemas } from '@/lib/api';
import type { Translate } from '@/lib/i18n';
import { cx } from '@/lib/cx';

/**
 * The dot is the owner's colour (--dot). One that would vanish into its chip is
 * drawn in the subtle ink in that theme instead: near-white on the light chip,
 * near-black (AWS's navy) on the dark one.
 */
function dotClass(hex: string): string {
    const linear = (channel: number) => {
        const c = channel / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

    if (luminance > 0.75) return 'bg-ink-subtle dark:bg-(--dot)';
    if (luminance < 0.03) return 'bg-(--dot) dark:bg-ink-subtle';
    return 'bg-(--dot)';
}

/** Tools and technologies, each name with a coloured dot (colours set in the admin). */
export function Technologies({ technologies, t, white }: { technologies: Schemas['Technology'][]; t: Translate; white: boolean }) {
    return (
        <section className={cx('py-14 sm:py-20', white && 'border-y border-line bg-surface')}>
            <div className="shell flex flex-col gap-8 sm:gap-9">
                <div className="flex flex-col items-center gap-2.5 text-center" data-reveal>
                    <h2 className="max-w-4xl text-[1.75rem] leading-[1.35] font-extrabold sm:text-[2.25rem]">{t('home.tech.title')}</h2>
                    <p className="max-w-[640px] text-[17px] text-ink-muted sm:text-lg">{t('home.tech.lead')}</p>
                </div>

                <ul className="flex flex-wrap justify-center gap-2.5 sm:gap-3" dir="ltr">
                    {technologies.map((tech, i) => (
                        <li
                            key={`${tech.name}-${i}`}
                            className="inline-flex items-center gap-2.5 rounded-btn-lg border border-line bg-surface-muted px-4 py-2 text-[15px] font-bold text-ink sm:px-[18px] sm:py-2.5"
                            data-reveal
                            style={{ '--reveal-delay': `${(i % 8) * 40}ms` } as React.CSSProperties}
                        >
                            <span className={cx('size-2.5 shrink-0 rounded-full', dotClass(tech.color))} style={{ '--dot': tech.color } as React.CSSProperties} aria-hidden="true" />
                            {tech.name}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
