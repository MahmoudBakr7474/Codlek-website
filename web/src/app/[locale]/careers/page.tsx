import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArrowRight, BriefcaseBusiness, Clock, FileUser, Layers, MapPin } from 'lucide-react';
import { ApplyLink } from '@/components/forms/ApplyLink';
import { CareersForm } from '@/components/forms/CareersForm';
import { formTexts } from '@/components/forms/form-texts';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconTile } from '@/components/ui/IconTile';
import { PageHero } from '@/components/ui/PageHero';
import { getJobs } from '@/lib/api';
import { cx } from '@/lib/cx';
import { href } from '@/lib/i18n';
import { pageContext } from '@/lib/page';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps<'/[locale]/careers'>): Promise<Metadata> {
    const { locale, site, t } = await pageContext(params);
    return pageMetadata({ locale, site, path: 'careers', title: t('careers.hero.title'), description: t('careers.hero.lead') });
}

/** Each department keeps one tile colour (in order of first appearance), so jobs of the same team read as a group. */
const tones = ['blue', 'teal', 'magenta', 'amber'];

export default async function CareersPage({ params, searchParams }: PageProps<'/[locale]/careers'>) {
    const { locale, site, t } = await pageContext(params);
    const jobs = await getJobs(locale);
    const hasJobs = jobs.length > 0;
    const departments = [...new Set(jobs.map((job) => job.department))];
    const pill = 'inline-flex items-center gap-1.5 rounded-full bg-surface-chip px-3 py-1';

    const form = (selectedJob?: string) => (
        <CareersForm locale={locale} texts={formTexts(site.texts)} jobs={jobs.map((job) => ({ id: job.id, title: job.title }))} selectedJob={selectedJob} privacyHref={href(locale, 'privacy')} />
    );

    return (
        <>
            <PageHero locale={locale} t={t} eyebrow={t('careers.hero.eyebrow')} title={t('careers.hero.title')} lead={t('careers.hero.lead')} />

            <section className="py-16 sm:py-24">
                <div className="shell">
                    {/* With open jobs: the list beside the form. Without: one centred column (message, then the form). */}
                    <div className={cx('grid items-start gap-10', hasJobs ? 'lg:grid-cols-12 lg:gap-8 xl:gap-10' : 'mx-auto max-w-3xl')}>
                        <div className={cx('min-w-0', hasJobs && 'lg:col-span-7')}>
                            <div className="flex items-center gap-3">
                                <h2 className="text-[1.375rem] font-extrabold sm:text-[1.75rem]">{t('careers.open_positions')}</h2>
                                {hasJobs && (
                                    <span className="grid h-7 min-w-7 place-items-center rounded-full bg-primary-soft px-2 text-sm font-bold text-primary-ink" aria-hidden="true">
                                        {jobs.length}
                                    </span>
                                )}
                            </div>

                            {!hasJobs ? (
                                <EmptyState icon={BriefcaseBusiness} text={t('careers.no_jobs')} className="mt-6" />
                            ) : (
                                <ul className="mt-6 flex flex-col gap-4" role="list">
                                    {jobs.map((job, i) => (
                                        <li key={job.id} data-reveal style={{ '--reveal-delay': `${Math.min(i, 5) * 60}ms` } as React.CSSProperties}>
                                            <article className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card sm:p-7">
                                                {/* The meta pills run under tile and title on phones, beside the tile from `sm`. */}
                                                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 sm:items-start sm:gap-y-2">
                                                    <IconTile icon={BriefcaseBusiness} tone={tones[departments.indexOf(job.department) % tones.length]} size="lg" className="sm:row-span-2" />
                                                    <h3 id={`job-${job.id}`} className="text-lg font-extrabold sm:text-xl">
                                                        {job.title}
                                                    </h3>
                                                    <ul className="col-span-2 flex flex-wrap gap-2 text-[13px] font-bold text-ink-soft sm:col-span-1 sm:col-start-2">
                                                        <li className={pill}>
                                                            <Layers className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" /> {job.department}
                                                        </li>
                                                        <li className={pill}>
                                                            <MapPin className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" /> {job.location}
                                                        </li>
                                                        <li className={pill}>
                                                            <Clock className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" /> {job.type}
                                                        </li>
                                                    </ul>
                                                </div>
                                                <p className="text-[15px] whitespace-pre-line text-ink-muted">{job.description}</p>
                                                <div className="border-t border-line pt-4">
                                                    <ApplyLink
                                                        jobId={job.id}
                                                        href={href(locale, 'careers', { job: job.id }, 'apply')}
                                                        describedBy={`job-${job.id}`}
                                                        className="group/link -my-2.5 inline-flex items-center gap-1.5 rounded-sm py-2.5 text-[15px] font-bold text-primary-ink"
                                                    >
                                                        <span className="underline-offset-4 group-hover/link:underline">{t('careers.apply_for')}</span>
                                                        <ArrowRight
                                                            className="size-4 shrink-0 transition-transform duration-200 group-hover/link:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/link:-translate-x-0.5"
                                                            aria-hidden="true"
                                                        />
                                                    </ApplyLink>
                                                </div>
                                            </article>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className={cx('min-w-0', hasJobs && 'lg:col-span-5')}>
                            <div id="apply" className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-8">
                                <div className="flex items-start gap-4">
                                    <IconTile icon={FileUser} size="lg" />
                                    <div className="min-w-0">
                                        <h2 className="text-[1.375rem] font-extrabold sm:text-2xl">{t('careers.apply_title')}</h2>
                                        <p className="mt-1 text-[15px] text-ink-muted">{t('careers.apply_lead')}</p>
                                    </div>
                                </div>

                                {/* ?job=3 (the "apply" links without JavaScript) picks the job. */}
                                <Suspense fallback={form()}>
                                    {searchParams.then(({ job }) => form(typeof job === 'string' && jobs.some((j) => String(j.id) === job) ? job : undefined))}
                                </Suspense>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
