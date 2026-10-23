import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { Industries } from '@/components/home/Industries';
import { Journey } from '@/components/home/Journey';
import { Projects } from '@/components/home/Projects';
import { Services } from '@/components/home/Services';
import { Team } from '@/components/home/Team';
import { Technologies } from '@/components/home/Technologies';
import { Testimonials } from '@/components/home/Testimonials';
import { Why } from '@/components/home/Why';
import { CtaBand } from '@/components/ui/CtaBand';
import { getHome, getSite } from '@/lib/api';
import { isLocale, translator } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
    const value = (await params).locale;
    const locale = isLocale(value) ? value : 'ar';
    return pageMetadata({ locale, site: await getSite(locale), path: 'home' });
}

/*
 * The hero, then the sections in the order and visibility set in the admin (the API
 * already dropped hidden and empty ones). Backgrounds alternate by position, counting
 * from the first section after the hero: page background, white with hairlines, page
 * background… The journey is always navy but still takes its turn; the closing blue
 * band sits on whatever its turn gives.
 */
export default async function HomePage({ params }: PageProps<'/[locale]'>) {
    const value = (await params).locale;
    const locale = isLocale(value) ? value : 'ar';
    const [site, home] = await Promise.all([getSite(locale), getHome(locale)]);
    const t = translator(site.texts);

    return (
        <>
            <Hero home={home} locale={locale} t={t} />

            {home.sections.map((section, i) => {
                const white = i % 2 === 1;
                switch (section) {
                    case 'services':
                        return <Services key={section} services={home.services} locale={locale} t={t} white={white} />;
                    case 'projects':
                        return <Projects key={section} projects={home.featured} locale={locale} t={t} white={white} />;
                    case 'why':
                        return <Why key={section} why={home.why} years={home.years} locale={locale} t={t} white={white} />;
                    case 'technologies':
                        return <Technologies key={section} technologies={home.technologies} t={t} white={white} />;
                    case 'industries':
                        return <Industries key={section} industries={home.industries} t={t} white={white} />;
                    case 'journey':
                        return <Journey key={section} journey={home.journey} t={t} />;
                    case 'team':
                        return <Team key={section} team={home.team} t={t} white={white} />;
                    case 'testimonials':
                        return <Testimonials key={section} testimonials={home.testimonials} locale={locale} t={t} white={white} />;
                    case 'cta':
                        return <CtaBand key={section} locale={locale} t={t} className={white ? 'border-y border-line bg-surface' : undefined} />;
                    default:
                        return null;
                }
            })}
        </>
    );
}
