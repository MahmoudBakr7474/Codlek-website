import { NextResponse, type NextRequest } from 'next/server';

const API = (process.env.API_URL ?? 'http://localhost:5080').replace(/\/$/, '');

/** PublicEndpoints.PostsPerPage in the API. */
const POSTS_PER_PAGE = 9;

/*
 * Arabic is the default language at "/", English lives under "/en". Inside the
 * app every page sits under [locale], so an Arabic URL is rewritten to /ar/...
 * (the visitor keeps the clean URL) and /ar/... itself redirects to the clean one.
 */
export async function proxy(request: NextRequest) {
    const { pathname, search, searchParams } = request.nextUrl;

    if (pathname === '/ar' || pathname.startsWith('/ar/')) {
        const url = request.nextUrl.clone();
        url.pathname = pathname.slice(3) || '/';
        return NextResponse.redirect(url, 308);
    }

    const english = pathname === '/en' || pathname.startsWith('/en/');
    const locale = english ? 'en' : 'ar';
    const page = english ? pathname.slice(3) || '/' : pathname;

    if (await isMissingBlogPage(page, searchParams)) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/not-found`;
        url.search = '';
        return NextResponse.rewrite(url);
    }

    if (english) {
        return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = `/ar${pathname === '/' ? '' : pathname}`;
    url.search = search;
    return NextResponse.rewrite(url);
}

/*
 * The article and blog pages stream, so a notFound() in them can only add
 * "noindex" to a 200. An unknown article, or a blog page past the last, is caught
 * here instead and rewritten to the 404 page. The published slugs are kept for a
 * few minutes; a slug (or page) the list doesn't have refreshes it first, at most
 * every 10 seconds, so a post published a moment ago opens at once. When the API
 * can't be reached the page decides, as before.
 */
async function isMissingBlogPage(page: string, searchParams: URLSearchParams): Promise<boolean> {
    const match = /^\/blog(?:\/([^/]+))?\/?$/.exec(page);
    if (!match) {
        return false;
    }

    let exists: (slugs: Set<string>) => boolean;
    if (match[1]) {
        const slug = safeDecode(match[1]);
        exists = (slugs) => slugs.has(slug);
    } else {
        const number = Number(searchParams.get('page') ?? '1');
        if (!Number.isInteger(number) || number <= 1) {
            return false;
        }

        exists = (slugs) => number <= Math.ceil(slugs.size / POSTS_PER_PAGE);
    }

    const known = await publishedSlugs(false);
    if (known && exists(known)) {
        return false;
    }

    const fresh = await publishedSlugs(true);
    return fresh !== null && !exists(fresh);
}

let published: { slugs: Set<string>; at: number } | null = null;

async function publishedSlugs(refresh: boolean): Promise<Set<string> | null> {
    const age = published ? Date.now() - published.at : Infinity;
    if (published && age < (refresh ? 10_000 : 5 * 60_000)) {
        return published.slugs;
    }

    try {
        const response = await fetch(`${API}/api/public/sitemap`, { cache: 'no-store', signal: AbortSignal.timeout(3000) });
        if (!response.ok) {
            return published?.slugs ?? null;
        }

        const data = (await response.json()) as { posts: { slug: string }[] };
        published = { slugs: new Set(data.posts.map((post) => post.slug)), at: Date.now() };
        return published.slugs;
    } catch {
        return published?.slugs ?? null;
    }
}

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export const config = {
    // Pages only: not Next's own files, the revalidation hook, metadata routes or files in public/.
    matcher: ['/((?!_next|api|sitemap\\.xml|robots\\.txt|favicon\\.ico|site\\.webmanifest|images/).*)'],
};
