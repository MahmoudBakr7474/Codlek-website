import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Calendar, Clock, MessageCircle } from 'lucide-react';
import { PostCard } from '@/components/cards/PostCard';
import { PostCover } from '@/components/cards/PostCover';
import { ButtonLink } from '@/components/ui/Button';
import { CtaBand } from '@/components/ui/CtaBand';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { IconTile } from '@/components/ui/IconTile';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getArticle, getSitemap } from '@/lib/api';
import { cx } from '@/lib/cx';
import { choice, formatDate, href, isoDate, postHref } from '@/lib/i18n';
import { pageContext } from '@/lib/page';
import { pageMetadata } from '@/lib/seo';
import { absolute } from '@/lib/site-url';

/** The published articles are prerendered; a new one is rendered on its first visit. */
export async function generateStaticParams() {
    const { posts } = await getSitemap();
    return posts.length > 0 ? posts.map((post) => ({ slug: post.slug })) : [{ slug: 'no-articles-yet' }];
}

export async function generateMetadata({ params }: PageProps<'/[locale]/blog/[slug]'>): Promise<Metadata> {
    const { locale, site } = await pageContext(params);
    const article = await getArticle(locale, decodeURIComponent((await params).slug));
    if (!article) {
        return {};
    }

    const { post } = article;
    return {
        ...pageMetadata({ locale, site, path: `/blog/${encodeURIComponent(post.slug)}`, title: post.title, description: post.excerpt, image: post.coverUrl, type: 'article' }),
        other: { 'article:published_time': post.publishedAt },
    };
}

export default async function ArticlePage({ params }: PageProps<'/[locale]/blog/[slug]'>) {
    const { locale, site, t } = await pageContext(params);
    const article = await getArticle(locale, decodeURIComponent((await params).slug));
    if (!article) {
        notFound();
    }

    const { post, related } = article;
    const url = absolute(postHref(locale, post.slug));
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt ?? undefined,
        inLanguage: locale,
        image: post.coverUrl ?? site.ogImageUrl ?? absolute('/images/og-cover.png'),
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'Codlek' },
        publisher: { '@type': 'Organization', name: 'Codlek', logo: { '@type': 'ImageObject', url: absolute('/images/brand/codlek-logo.png') } },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

            <article>
                <PageHero locale={locale} t={t} title={post.title} lead={post.excerpt} crumbs={[{ label: t('nav.blog'), href: href(locale, 'blog') }]}>
                    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-ink-muted">
                        {post.category && <Eyebrow>{post.category}</Eyebrow>}
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar className="size-4 shrink-0" aria-hidden="true" />
                            <span className="sr-only">{t('blog.published_on')}</span>
                            <time dateTime={isoDate(post.publishedAt)}>{formatDate(post.publishedAt, locale)}</time>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="size-4 shrink-0" aria-hidden="true" />
                            {choice(t('blog.reading_time'), post.readingMinutes)}
                        </span>
                    </div>
                </PageHero>

                {/* A white sheet (cover, then the text) on the page background; edge to edge on phones, for a
                    wider line. From `lg` the call to action stays beside it while reading. */}
                <div className="shell py-16 sm:py-24">
                    <div className="grid items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="-mx-4 min-w-0 overflow-hidden border-y border-line bg-surface shadow-card sm:mx-0 sm:rounded-card sm:border-x">
                            <div className={cx('overflow-hidden border-b border-line bg-surface-sunken', post.coverUrl ? 'aspect-[2/1]' : 'aspect-[5/2] sm:aspect-[16/5]')}>
                                <PostCover coverUrl={post.coverUrl} seed={post.slug} eager size="lg" />
                            </div>

                            {/* The API sanitized the HTML (only safe tags and attributes are left). */}
                            <div
                                className="prose prose-codlek max-w-none px-5 py-8 sm:prose-lg prose-a:font-semibold prose-img:rounded-box sm:px-10 sm:py-10 xl:px-14 xl:py-12"
                                dangerouslySetInnerHTML={{ __html: post.body }}
                            />
                        </div>

                        <aside className="lg:sticky lg:top-28 lg:row-span-2">
                            <div className="flex flex-col items-start gap-3 rounded-card border border-navy-line bg-navy p-6 text-white sm:p-7" data-reveal>
                                <IconTile icon={MessageCircle} tone="navy" />
                                <p className="mt-1 text-xl leading-normal font-extrabold">{t('blog.share_cta_title')}</p>
                                <p className="text-[15px] text-navy-muted">{t('blog.share_cta_text')}</p>
                                <ButtonLink href={href(locale, 'contact')} iconEnd={ArrowRight} className="mt-2 w-full focus-visible:outline-white">
                                    {t('cta.consult')}
                                </ButtonLink>
                            </div>
                        </aside>

                        <Link
                            href={href(locale, 'blog')}
                            className="inline-flex min-h-11 items-center gap-2 justify-self-start rounded-btn font-bold text-primary-ink underline-offset-4 hover:underline"
                        >
                            <ArrowLeft className="size-[18px] shrink-0 rtl:-scale-x-100" aria-hidden="true" />
                            {t('cta.back_to_blog')}
                        </Link>
                    </div>
                </div>
            </article>

            {/* Related articles: a white band, then the blue band. Tablets have two columns, so they show the first two. */}
            {related.length > 0 ? (
                <>
                    <section className="border-y border-line bg-surface py-16 sm:py-24">
                        <div className="shell">
                            <SectionHeader align="start" title={t('blog.related')} />
                            <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 sm:max-lg:[&>:nth-child(3)]:hidden">
                                {related.map((item, i) => (
                                    <PostCard key={item.slug} post={item} locale={locale} t={t} delay={i * 70} />
                                ))}
                            </div>
                        </div>
                    </section>
                    <CtaBand locale={locale} t={t} />
                </>
            ) : (
                // Shares the page background with the article above.
                <CtaBand locale={locale} t={t} className="pt-0 sm:pt-0" />
            )}
        </>
    );
}
