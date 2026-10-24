import { Cloud, Code, Database, type LucideIcon } from 'lucide-react';
import {
    siAndroid,
    siAngular,
    siCloudflare,
    siDocker,
    siDotnet,
    siElementor,
    siFigma,
    siFirebase,
    siFlutter,
    siGit,
    siGithub,
    siGoogleads,
    siGoogleanalytics,
    siGooglesearchconsole,
    siIos,
    siKotlin,
    siLaravel,
    siMeta,
    siMongodb,
    siMysql,
    siNextdotjs,
    siNodedotjs,
    siPhp,
    siPostgresql,
    siReact,
    siRedis,
    siShopify,
    siSwift,
    siTailwindcss,
    siTypescript,
    siVercel,
    siVuedotjs,
    siWoocommerce,
    siWordpress,
    type SimpleIcon,
} from 'simple-icons';
import type { Schemas } from '@/lib/api';
import type { Translate } from '@/lib/i18n';
import { cx } from '@/lib/cx';

type Logo = { icon: SimpleIcon } | { glyph: LucideIcon; hex: string };

/*
 * Logos by tool name, lower-cased without spaces, dots or dashes, so "Node.js",
 * "nodejs" and "Node JS" all match. Simple Icons has no AWS or SQL Server logo:
 * those get a plain cloud and database in the brand colour.
 */
const logos: Record<string, Logo> = {};
const add = (logo: Logo, ...names: string[]) => names.forEach((name) => (logos[name] = logo));

add({ icon: siWordpress }, 'wordpress');
add({ icon: siWoocommerce }, 'woocommerce');
add({ icon: siShopify }, 'shopify');
add({ icon: siElementor }, 'elementor');
add({ icon: siReact }, 'react', 'reactjs', 'reactnative');
add({ icon: siNextdotjs }, 'next', 'nextjs');
add({ icon: siTypescript }, 'typescript');
add({ icon: siNodedotjs }, 'node', 'nodejs');
add({ icon: siDotnet }, 'net', 'dotnet', 'aspnet', 'aspnetcore', 'netcore', 'c#', 'csharp');
add({ icon: siPhp }, 'php');
add({ icon: siLaravel }, 'laravel');
add({ icon: siFlutter }, 'flutter');
add({ icon: siSwift }, 'swift');
add({ icon: siIos }, 'ios');
add({ icon: siKotlin }, 'kotlin');
add({ icon: siAndroid }, 'android');
add({ icon: siMysql }, 'mysql');
add({ icon: siPostgresql }, 'postgres', 'postgresql');
add({ icon: siMongodb }, 'mongodb');
add({ icon: siRedis }, 'redis');
add({ icon: siFirebase }, 'firebase');
add({ icon: siDocker }, 'docker');
add({ icon: siCloudflare }, 'cloudflare');
add({ icon: siVercel }, 'vercel');
add({ icon: siGit }, 'git');
add({ icon: siGithub }, 'github');
add({ icon: siTailwindcss }, 'tailwind', 'tailwindcss');
add({ icon: siVuedotjs }, 'vue', 'vuejs');
add({ icon: siAngular }, 'angular');
add({ icon: siFigma }, 'figma');
add({ icon: siGoogleads }, 'googleads');
add({ icon: siMeta }, 'meta', 'metaads', 'facebookads');
add({ icon: siGooglesearchconsole }, 'searchconsole', 'googlesearchconsole');
add({ icon: siGoogleanalytics }, 'analytics', 'googleanalytics');
add({ glyph: Cloud, hex: 'FF9900' }, 'aws', 'amazonwebservices');
add({ glyph: Database, hex: 'CC2927' }, 'sqlserver', 'mssql', 'microsoftsqlserver');

function luminance(hex: string): number {
    const linear = (channel: number) => {
        const c = channel / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.replace('#', '').slice(i, i + 2), 16));
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * The brand colour (--brand), kept readable on the chip: very light colours
 * (React's cyan) are darkened on the light chip, very dark ones (Next.js's black,
 * .NET's purple) lightened on the dark chip, and a near-white owner colour drawn
 * in the subtle ink in light mode.
 */
function tint(hex: string): string {
    const l = luminance(hex);
    return cx(
        l > 0.75 ? 'text-ink-subtle dark:text-(--brand)' : l > 0.45 ? 'text-[color-mix(in_srgb,var(--brand)_70%,black)]' : 'text-(--brand)',
        l < 0.12 && 'dark:text-[color-mix(in_srgb,var(--brand)_45%,white)]',
    );
}

/** The tool's logo; a name without one gets a code glyph in the owner's colour (set in the admin). */
function TechLogo({ name, color }: { name: string; color: string }) {
    const logo = logos[name.toLowerCase().replace(/[\s.\-_]/g, '')];
    const hex = logo ? ('icon' in logo ? logo.icon.hex : logo.hex) : color.replace('#', '');
    const className = cx('size-[18px] shrink-0', tint(hex));
    const style = { '--brand': `#${hex}` } as React.CSSProperties;

    if (logo && 'icon' in logo) {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
                <path d={logo.icon.path} />
            </svg>
        );
    }

    const Glyph = logo?.glyph ?? Code;
    return <Glyph className={className} style={style} strokeWidth={2.2} aria-hidden="true" />;
}

/** Tools and technologies, each name with its logo. */
export function Technologies({ technologies, t, white }: { technologies: Schemas['Technology'][]; t: Translate; white: boolean }) {
    return (
        <section className={cx('py-14 sm:py-20', white && 'border-y border-line bg-surface')}>
            <div className="shell flex flex-col gap-8 sm:gap-9">
                <div className="flex flex-col items-center gap-2.5 text-center" data-reveal>
                    <h2 className="max-w-4xl text-[1.75rem] leading-[1.35] font-extrabold sm:text-[2.25rem]">{t('home.tech.title')}</h2>
                    <p className="max-w-[640px] text-[17px] text-ink-muted sm:text-lg">{t('home.tech.lead')}</p>
                </div>

                <ul className="flex flex-wrap justify-center gap-2.5 sm:gap-3" dir="ltr">
                    {technologies.map((tech, i) => (
                        <li
                            key={`${tech.name}-${i}`}
                            className="inline-flex items-center gap-2.5 rounded-btn-lg border border-line bg-surface-muted px-4 py-2 text-[15px] font-bold text-ink sm:px-[18px] sm:py-2.5"
                            data-reveal
                            style={{ '--reveal-delay': `${(i % 8) * 40}ms` } as React.CSSProperties}
                        >
                            <TechLogo name={tech.name} color={tech.color} />
                            {tech.name}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
