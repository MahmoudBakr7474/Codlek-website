import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { components } from './api-types';
import type { Locale } from './i18n';

/*
 * The public API (api/ in this repo). Every read is cached under the "cms" tag
 * for an hour; the API calls /api/revalidate after each save in the admin, which
 * drops the tag, so the site shows the owner's change on the next visit.
 */

export type Schemas = components['schemas'];
export type SiteData = Schemas['SiteDto'];
export type HomeData = Schemas['HomeDto'];
export type ProjectData = Schemas['ProjectDto'];
export type ServiceData = Schemas['ServiceDto'];
export type PostCardData = Schemas['PostCardDto'];
export type ArticleData = Schemas['ArticleDto'];

const API = (process.env.API_URL ?? 'http://localhost:5080').replace(/\/$/, '');

async function read<T>(path: string): Promise<T | null> {
    'use cache';
    cacheLife('hours');
    cacheTag('cms');

    const response = await fetch(`${API}/api/public/${path}`);
    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`API ${path} answered ${response.status}`);
    }

    return (await response.json()) as T;
}

async function must<T>(path: string): Promise<T> {
    const data = await read<T>(path);
    if (data === null) {
        throw new Error(`API ${path} not found`);
    }

    return data;
}

export const getSite = (locale: Locale) => must<SiteData>(`${locale}/site`);
export const getHome = (locale: Locale) => must<HomeData>(`${locale}/home`);
export const getAbout = (locale: Locale) => must<Schemas['About']>(`${locale}/about`);
export const getServices = (locale: Locale) => must<ServiceData[]>(`${locale}/services`);
export const getJobs = (locale: Locale) => must<Schemas['JobDto'][]>(`${locale}/jobs`);
export const getLegal = (locale: Locale, page: 'privacy' | 'terms') => must<Schemas['LegalDto']>(`${locale}/legal/${page}`);
export const getSitemap = () => must<Schemas['SitemapDto']>('sitemap');

export const getProjects = (locale: Locale, category?: string) =>
    must<Schemas['ProjectsDto']>(`${locale}/projects${category ? `?category=${encodeURIComponent(category)}` : ''}`);

/** null: a page past the last one. */
export const getPosts = (locale: Locale, page: number) =>
    read<Schemas['PostsPageDto']>(`${locale}/posts${page > 1 ? `?page=${page}` : ''}`);

/** null: no such (published) article. */
export const getArticle = (locale: Locale, slug: string) => read<ArticleData>(`${locale}/posts/${encodeURIComponent(slug)}`);

/** The year for the footer, cached like the content (no clock read while prerendering a page). */
export async function currentYear(): Promise<number> {
    'use cache';
    cacheLife('days');
    return new Date().getFullYear();
}
