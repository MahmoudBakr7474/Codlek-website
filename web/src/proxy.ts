import { NextResponse, type NextRequest } from 'next/server';

/*
 * Arabic is the default language at "/", English lives under "/en". Inside the
 * app every page sits under [locale], so an Arabic URL is rewritten to /ar/...
 * (the visitor keeps the clean URL) and /ar/... itself redirects to the clean one.
 */
export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    if (pathname === '/en' || pathname.startsWith('/en/')) {
        return NextResponse.next();
    }

    if (pathname === '/ar' || pathname.startsWith('/ar/')) {
        const url = request.nextUrl.clone();
        url.pathname = pathname.slice(3) || '/';
        return NextResponse.redirect(url, 308);
    }

    const url = request.nextUrl.clone();
    url.pathname = `/ar${pathname === '/' ? '' : pathname}`;
    url.search = search;
    return NextResponse.rewrite(url);
}

export const config = {
    // Pages only: not Next's own files, the revalidation hook, metadata routes or files in public/.
    matcher: ['/((?!_next|api|sitemap\\.xml|robots\\.txt|favicon\\.ico|site\\.webmanifest|images/).*)'],
};
