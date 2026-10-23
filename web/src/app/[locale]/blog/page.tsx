import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Newspaper } from 'lucide-react';
import { PostCard } from '@/components/cards/PostCard';
import { CtaBand } from '@/components/ui/CtaBand';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHero } from '@/components/ui/PageHero';
import { Pagination } from '@/components/ui/Pagination';
import { getPosts } from '@/lib/api';
import { href, type Locale, type Translate } from '@/lib/i18n';
import { pageContext } from '@/lib/page';
import { pageMetadata } from '@/lib/seo';

function pageNumber(value: string | string[] | undefined): number {
    const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : 1;
    return number > 1 ? number : 1;
}

export async function generateMetadata({ params, searchParams }: PageProps<'/[locale]/blog'>): Promise<Metadata> {
    const { locale, site, t } = await pageContext(params);
    const page = pageNumber((await searchParams).page);
    // Page 2 lists other articles than page 1: its number stays in the canonical URL.
    return pageMetadata({ locale, site, path: 'blog', query: { page: page > 1 ? page : undefined }, title: t('blog.hero.title'), description: t('blog.hero.lead') });
}

export default async function BlogPage({ params, searchParams }: PageProps<'/[locale]/blog'>) {
    const { locale, t } = await pageContext(params);

    return (
        <>
            <PageHero locale={locale} t={t} eyebrow={t('blog.hero.eyebrow')} title={t('blog.hero.title')} lead={t('blog.hero.lead')} />

            {/* The articles sit on the page background; the blue band below brings the space under them. */}
            <section className="pt-16 sm:pt-24">
                <div className="shell">
                    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
                        {searchParams.then(({ page }) => (
                            <PostList locale={locale} t={t} page={pageNumber(page)} />
                        ))}
                    </Suspense>
                </div>
            </section>

            <CtaBand locale={locale} t={t} />
        </>
    );
}

async function PostList({ locale, t, page }: { locale: Locale; t: Translate; page: number }) {
    const result = await getPosts(locale, page);

    // ?page=99 would be an empty page that still claims to be canonical.
    if (result === null) {
        notFound();
    }

    if (result.posts.length === 0) {
        return <EmptyState icon={Newspaper} text={t('blog.empty')} />;
    }

    return (
        <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {result.posts.map((post, i) => (
                    <PostCard key={post.slug} post={post} locale={locale} t={t} delay={(i % 3) * 70} heading="h2" eager={i === 0} />
                ))}
            </div>

            <Pagination
                page={result.page}
                lastPage={result.lastPage}
                url={(n) => href(locale, 'blog', { page: n > 1 ? n : undefined })}
                label={t('pagination')}
                previous={locale === 'ar' ? 'السابق' : 'Previous'}
                next={locale === 'ar' ? 'التالي' : 'Next'}
            />
        </>
    );
}
