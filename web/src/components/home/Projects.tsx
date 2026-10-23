import { ArrowRight } from 'lucide-react';
import type { ProjectData } from '@/lib/api';
import { href, type Locale, type Translate } from '@/lib/i18n';
import { cx } from '@/lib/cx';
import { ProjectCard } from '../cards/ProjectCard';
import { ButtonLink } from '../ui/Button';
import { SectionHeader } from '../ui/SectionHeader';

/** Projects marked "featured" in the admin (four at most), with the way to the full portfolio. */
export function Projects({ projects, locale, t, white }: { projects: ProjectData[]; locale: Locale; t: Translate; white: boolean }) {
    // Four cards: 2 × 2 until there is room for the design's single row.
    const columns = projects.length === 4 ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))]';

    return (
        <section id="projects" className={cx('py-16 sm:py-24', white && 'border-y border-line bg-surface')}>
            <div className="shell flex flex-col gap-10 sm:gap-12">
                <SectionHeader
                    align="start"
                    eyebrow={t('home.projects.eyebrow')}
                    title={t('home.projects.title')}
                    lead={t('home.projects.lead')}
                    actions={
                        <ButtonLink href={href(locale, 'projects')} variant="outline" iconEnd={ArrowRight}>
                            {t('cta.all_projects')}
                        </ButtonLink>
                    }
                />

                <div className={cx('grid gap-6', columns)}>
                    {projects.map((project, i) => (
                        <ProjectCard key={project.id} project={project} locale={locale} t={t} delay={(i % 4) * 70} />
                    ))}
                </div>
            </div>
        </section>
    );
}
