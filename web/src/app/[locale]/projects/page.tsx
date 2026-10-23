import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LayoutGrid } from 'lucide-react';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { CtaBand } from '@/components/ui/CtaBand';
import { CurrentInView } from '@/components/ui/CurrentInView';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { PageHero } from '@/components/ui/PageHero';
import { getProjects } from '@/lib/api';
import { cx } from '@/lib/cx';
import { choice, href, type Locale, type Translate } from '@/lib/i18n';
import { pageContext } from '@/lib/page';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps<'/[locale]/projects'>): Promise<Metadata> {
    const { locale, site, t } = await pageContext(params);
    // The ?category= filter is not part of the canonical URL.
    return pageMetadata({ locale, site, path: 'projects', title: t('projects.hero.title'), description: t('projects.hero.lead') });
}

export default async function ProjectsPage({ params, searchParams }: PageProps<'/[locale]/projects'>) {
    const { locale, t } = await pageContext(params);

    return (
        <>
            <PageHero locale={locale} t={t} eyebrow={t('projects.hero.eyebrow')} title={t('projects.hero.title')} lead={t('projects.hero.lead')} />

            {/* The projects sit on the page background; the blue band below brings the space under them. */}
            <section className="pt-16 sm:pt-24">
                <div className="shell">
                    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
                        {searchParams.then(({ category }) => (
                            <ProjectList locale={locale} t={t} category={typeof category === 'string' ? category : undefined} />
                        ))}
                    </Suspense>
                </div>
            </section>

            <CtaBand locale={locale} t={t} />
        </>
    );
}

/*
 * Category filter: plain links, so each view has its own URL. 44px pills; the current
 * one is the soft blue of the header's current page. On phones the pills are one row
 * that scrolls sideways, with the current one brought into view; from `sm` they wrap.
 */
async function ProjectList({ locale, t, category }: { locale: Locale; t: Translate; category?: string }) {
    const { categories, active, projects } = await getProjects(locale, category);

    if (projects.length === 0 && !active) {
        return <EmptyState icon={LayoutGrid} text={t('projects.empty')} />;
    }

    const pill = 'inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[15px] transition-colors duration-200';
    const on = 'border-primary-line bg-primary-soft font-bold text-primary-ink';
    const off = 'border-line bg-surface font-semibold text-ink-soft shadow-xs hover:border-primary-line hover:text-primary-ink';

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <nav aria-label={t('projects.filter_label')} className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-auto">
                    <CurrentInView className="-my-1.5 flex gap-2.5 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
                        <li className="shrink-0">
                            <Link href={href(locale, 'projects')} className={cx(pill, active ? off : on)} aria-current={active ? undefined : 'page'}>
                                <LayoutGrid className="size-4 shrink-0" aria-hidden="true" />
                                {t('projects.all')}
                            </Link>
                        </li>
                        {categories.map((item) => {
                            const isActive = active === item.slug;
                            return (
                                <li key={item.slug} className="shrink-0">
                                    <Link href={href(locale, 'projects', { category: item.slug })} className={cx(pill, isActive ? on : off)} aria-current={isActive ? 'page' : undefined}>
                                        <Icon name={item.icon} fallback="layout-grid" className="size-4 shrink-0" />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </CurrentInView>
                </nav>
                <p className="text-sm font-semibold text-ink-muted" aria-live="polite">
                    {choice(t('projects.count'), projects.length)}
                </p>
            </div>

            <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project, i) => (
                    <ProjectCard key={project.id} project={project} locale={locale} t={t} delay={(i % 3) * 70} heading="h2" eager={i === 0} />
                ))}
            </div>
        </>
    );
}
