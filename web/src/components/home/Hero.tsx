/* eslint-disable @next/next/no-img-element -- the hero picture is the owner's upload or a bundled illustration */
import { ArrowRight, Check, Lock, ShieldCheck } from 'lucide-react';
import type { HomeData } from '@/lib/api';
import { href, type Locale, type Translate } from '@/lib/i18n';
import { cx } from '@/lib/cx';
import { BrowserDots } from '../ui/BrowserDots';
import { ButtonLink } from '../ui/Button';
import { Eyebrow } from '../ui/Eyebrow';

const HERO_IMAGE = '/images/hero/hero-illustration.webp';

/**
 * A score such as "4.9/5" is drawn as a big 4.9 and a small /5. Only when the first
 * number is not above the second, so "24/7" stays whole. Arabic digits count too.
 */
function score(value: string): [string, string | null] {
    const number = '[0-9٠-٩۰-۹]+(?:[.,٫][0-9٠-٩۰-۹]+)?';
    const match = value.match(new RegExp(`^\\s*(${number})\\s*/\\s*(${number})\\s*$`, 'u'));
    const toFloat = (text: string) =>
        parseFloat(
            text
                .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
                .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
                .replace(/[,٫]/g, '.'),
        );

    return match && toFloat(match[1]) <= toFloat(match[2]) ? [match[1], `/${match[2]}`] : [value, null];
}

/*
 * Hero: the text first in the DOM (the start side), the picture beside it. 'image':
 * the owner's picture or the bundled illustration. 'projects': one or two project
 * screenshots in browser frames (the API falls back to the picture when no project
 * has a screenshot).
 */
export function Hero({ home, locale, t }: { home: HomeData; locale: Locale; t: Translate }) {
    const [mainShot, secondShot] = home.heroVisual === 'projects' ? [home.showcase[0], home.showcase[1]] : [undefined, undefined];
    const statColumns = home.heroStats.length === 1 ? 'grid-cols-1' : home.heroStats.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

    return (
        <section className="border-b border-line bg-surface">
            <div className="shell grid items-center gap-14 pt-10 pb-16 sm:pt-14 sm:pb-20 lg:grid-cols-2 lg:pt-[72px]">
                <div className="flex min-w-0 flex-col gap-6" data-reveal>
                    {/* A long badge wraps on phones: softer corners than a pill there. */}
                    <Eyebrow icon={ShieldCheck} className="max-sm:rounded-2xl">
                        {t('home.hero.badge')}
                    </Eyebrow>

                    <h1 className="text-[2.25rem] leading-[1.3] font-extrabold sm:text-5xl lg:text-[3.5rem]">
                        {t('home.hero.title_1')}
                        <span className="block text-secondary">{t('home.hero.title_2')}</span>
                    </h1>

                    <p className="max-w-[560px] text-[17px] text-ink-muted sm:text-[19px]">{t('home.hero.lead')}</p>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <ButtonLink href={href(locale, 'contact')} size="lg" iconEnd={ArrowRight}>
                            {t('cta.start_now')}
                        </ButtonLink>
                        <ButtonLink href={href(locale, 'projects')} size="lg" variant="outline">
                            {t('cta.see_work')}
                        </ButtonLink>
                    </div>

                    {home.heroStats.length > 0 && (
                        <ul className={cx('grid max-w-[560px] rounded-box border border-line bg-surface-muted', statColumns)}>
                            {home.heroStats.map((stat, i) => {
                                const [value, outOf] = score(stat.value);
                                return (
                                    <li key={i} className={cx('min-w-0 px-4 py-4 sm:px-5', i < home.heroStats.length - 1 && 'border-e border-line')}>
                                        {/* bdi, not dir on the block: an ltr block would align its text left. */}
                                        <p className="text-[1.625rem] font-extrabold text-ink sm:text-[28px]">
                                            <bdi dir="ltr">
                                                {value}
                                                {outOf && <span className="text-base text-ink-muted">{outOf}</span>}
                                            </bdi>
                                        </p>
                                        <p className="text-sm font-semibold text-ink-muted">{stat.label}</p>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="relative min-w-0" data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
                    {mainShot ? (
                        <>
                            {/* The first project in a browser window that rises out of the frame, the second as a smaller window over its corner. */}
                            <div className="overflow-hidden rounded-panel border border-line bg-surface-sunken shadow-hero">
                                <div className="px-3 pt-3 sm:px-6 sm:pt-6">
                                    <div className="overflow-hidden rounded-t-2xl border border-b-0 border-line bg-surface shadow-card">
                                        <div className="flex items-center gap-1.5 border-b border-line px-3.5 py-2.5" dir="ltr" aria-hidden="true">
                                            <BrowserDots size="size-2.5" />
                                            {mainShot.host && (
                                                <span className="ms-2.5 flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded-md bg-surface-sunken px-2.5 text-xs text-ink-muted">
                                                    <Lock className="size-3 shrink-0" />
                                                    <span className="truncate">{mainShot.host}</span>
                                                </span>
                                            )}
                                        </div>
                                        <img src={mainShot.imageUrl!} alt="" className="shot block aspect-[16/10] w-full object-cover object-top" width={1200} height={750} fetchPriority="high" />
                                    </div>
                                </div>
                            </div>

                            {secondShot && (
                                // Only where it has room beside the trust card.
                                <div
                                    className="absolute end-5 -bottom-[22px] hidden w-[38%] overflow-hidden rounded-xl border border-line bg-surface shadow-float sm:block lg:hidden xl:block"
                                    aria-hidden="true"
                                >
                                    <div className="flex items-center gap-1 border-b border-line px-2.5 py-1.5" dir="ltr">
                                        <BrowserDots size="size-1.5" />
                                    </div>
                                    <img src={secondShot.imageUrl!} alt="" className="shot block aspect-[16/10] w-full object-cover object-top" width={1200} height={750} loading="lazy" decoding="async" />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="overflow-hidden rounded-panel border border-line bg-surface-sunken shadow-hero">
                            <img src={home.heroImageUrl ?? HERO_IMAGE} alt="" className="shot block aspect-[3/2] h-auto w-full object-cover" width={1200} height={800} fetchPriority="high" />
                        </div>
                    )}

                    {home.heroTrust && (
                        <div className="absolute start-4 -bottom-[22px] flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-2xl border border-line bg-surface px-[18px] py-3 shadow-float sm:start-6 sm:max-w-[calc(100%-3rem)]">
                            <span className="grid size-10 shrink-0 place-items-center rounded-btn bg-secondary-soft text-secondary">
                                <Check className="size-5" strokeWidth={2.4} aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-base leading-[1.3] font-extrabold text-ink">{t('home.hero.trust_title')}</p>
                                <p className="text-[13px] text-ink-muted">{t('home.hero.trust_text')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
