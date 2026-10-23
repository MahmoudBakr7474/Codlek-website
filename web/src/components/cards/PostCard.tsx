import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import type { PostCardData } from '@/lib/api';
import { choice, formatDate, isoDate, postHref, type Locale, type Translate } from '@/lib/i18n';
import { PostCover } from './PostCover';

/*
 * Article card: cover well, category pill + date, title, excerpt, then the reading
 * time and "read article" under a hairline. The title's stretched link makes the
 * whole card clickable; the card shows the focus ring.
 */
export function PostCard({
    post,
    locale,
    t,
    delay = 0,
    heading: Heading = 'h3',
    eager = false,
}: {
    post: PostCardData;
    locale: Locale;
    t: Translate;
    delay?: number;
    heading?: 'h2' | 'h3';
    eager?: boolean;
}) {
    return (
        <article
            className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary-line hover:shadow-float has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-3 has-[a:focus-visible]:outline-primary-ink"
            data-reveal
            style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
        >
            <div className="aspect-[16/9] overflow-hidden border-b border-line bg-surface-sunken">
                <PostCover coverUrl={post.coverUrl} seed={post.slug} eager={eager} className="transition duration-700 ease-out group-hover:scale-[1.03]" />
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-muted">
                    {post.category && <span className="rounded-full bg-surface-chip px-3 py-0.5 text-[13px] font-bold text-ink-soft">{post.category}</span>}
                    <time dateTime={isoDate(post.publishedAt)}>{formatDate(post.publishedAt, locale)}</time>
                </div>

                <Heading className="mt-3 text-[19px] leading-normal font-extrabold">
                    <Link
                        href={postHref(locale, post.slug)}
                        className="outline-none transition-colors duration-200 group-hover:text-primary-ink after:absolute after:inset-0 after:rounded-card"
                    >
                        {post.title}
                    </Link>
                </Heading>
                <p className="mt-2 line-clamp-3 text-[15px] text-ink-muted">{post.excerpt}</p>

                <div className="mt-auto pt-5">
                    <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                            <Clock className="size-4 shrink-0" aria-hidden="true" />
                            {choice(t('blog.reading_time'), post.readingMinutes)}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-[15px] font-bold text-primary-ink" aria-hidden="true">
                            {t('cta.read_more')}
                            <ArrowRight className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                        </span>
                    </div>
                </div>
            </div>
        </article>
    );
}
