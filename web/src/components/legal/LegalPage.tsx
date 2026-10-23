import Link from 'next/link';
import { ArrowRight, Calendar, Scale, ShieldCheck } from 'lucide-react';
import { getLegal } from '@/lib/api';
import { cx } from '@/lib/cx';
import { href, type Locale, type Translate } from '@/lib/i18n';
import { IconTile } from '../ui/IconTile';
import { PageHero } from '../ui/PageHero';
import { Toc } from './Toc';

/** Privacy policy and terms: numbered sections beside a table of contents, then a link to the other page. */
export async function LegalPage({ locale, t, page }: { locale: Locale; t: Translate; page: 'privacy' | 'terms' }) {
    const legal = await getLegal(locale, page);
    const other = page === 'privacy' ? 'terms' : 'privacy';

    return (
        <>
            {/* «Last updated» is page metadata: a small meta row (like an article's date), not a lead. */}
            <PageHero locale={locale} t={t} title={legal.title}>
                <p className="mt-4 flex items-center gap-1.5 text-sm text-ink-muted">
                    <Calendar className="size-4 shrink-0" aria-hidden="true" />
                    {legal.updated}
                </p>
            </PageHero>

            <section className="py-16 sm:py-24">
                <div className="shell grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
                    <Toc label={legal.title} titles={legal.sections.map((section) => section.title)} />

                    <div className="min-w-0 lg:col-span-8">
                        <article className="rounded-card border border-line bg-surface px-5 py-7 shadow-card sm:p-10">
                            {/* Even rhythm: 16px under each heading and between a paragraph and its list. */}
                            <div className="prose prose-codlek max-w-none prose-h2:mb-4 prose-h2:text-xl prose-p:my-0 prose-ul:my-0 sm:prose-h2:text-[1.375rem] [&_p+ul]:mt-4">
                                {legal.sections.map((section, i) => (
                                    <div key={i}>
                                        <h2 id={`s${i + 1}`} data-toc className={cx('flex items-start gap-3', i > 0 && 'mt-8 border-t border-line pt-8 sm:mt-10 sm:pt-10')}>
                                            <span className="not-prose grid size-8 shrink-0 place-items-center rounded-btn bg-primary-soft text-sm font-extrabold text-primary-ink">{i + 1}</span>
                                            <span className="min-w-0 pt-px">{section.title}</span>
                                        </h2>
                                        {section.text && <p>{section.text}</p>}
                                        {section.items.length > 0 && (
                                            <ul>
                                                {section.items.map((item, n) => (
                                                    <li key={n}>{item}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </article>

                        <Link
                            href={href(locale, other)}
                            className="group mt-4 flex items-center gap-4 rounded-box border border-line bg-surface p-4 shadow-card transition-colors duration-200 hover:border-primary-line sm:p-5"
                        >
                            <IconTile icon={other === 'terms' ? Scale : ShieldCheck} />
                            <span className="min-w-0 flex-1 text-base font-extrabold transition-colors group-hover:text-primary-ink">{t(`legal.${other}_title`)}</span>
                            <ArrowRight
                                className="size-5 shrink-0 text-primary-ink transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                                aria-hidden="true"
                            />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}

/** The introduction paragraph doubles as the page description. */
export async function legalDescription(locale: Locale, page: 'privacy' | 'terms'): Promise<string | undefined> {
    const legal = await getLegal(locale, page);
    return legal.sections[0]?.text ?? undefined;
}
