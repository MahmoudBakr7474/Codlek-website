import type { MetadataRoute } from 'next';
import { getSitemap } from '@/lib/api';
import { href, locales, type Page } from '@/lib/i18n';
import { absolute } from '@/lib/site-url';

const sitePages: Page[] = ['home', 'about', 'services', 'projects', 'blog', 'careers', 'contact', 'privacy', 'terms'];

/** Every page and published article in both languages, each with its hreflang alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const { posts } = await getSitemap();
    const entries = [
        ...sitePages.map((page) => ({ path: page as string, lastModified: undefined as string | undefined })),
        ...posts.map((post) => ({ path: `/blog/${encodeURIComponent(post.slug)}`, lastModified: post.updatedAt ?? undefined })),
    ];

    return entries.flatMap(({ path, lastModified }) => {
        const languages = { ar: absolute(href('ar', path)), en: absolute(href('en', path)), 'x-default': absolute(href('ar', path)) };
        return locales.map((locale) => ({
            url: absolute(href(locale, path)),
            lastModified,
            alternates: { languages },
        }));
    });
}
