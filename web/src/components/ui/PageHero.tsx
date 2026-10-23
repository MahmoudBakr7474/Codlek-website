import Link from 'next/link';
import { ChevronRight, House } from 'lucide-react';
import { href, type Locale, type Translate } from '@/lib/i18n';
import { cx } from '@/lib/cx';
import { Eyebrow } from './Eyebrow';

/*
 * Inner-page header: flat white band with a breadcrumb, pill, h1 and lead. The
 * children come right after the lead (jump links, article meta…). Breadcrumb
 * links get a 44px tall hit area without changing the layout (py + the same
 * negative margin). On phones the current item stays on the first row and is
 * cut with an ellipsis: an article title would otherwise repeat in full right
 * above the same title as the h1.
 */
export function PageHero({
    locale,
    t,
    eyebrow,
    title,
    lead,
    crumbs = [],
    children,
}: {
    locale: Locale;
    t: Translate;
    eyebrow?: string;
    title: string;
    lead?: string;
    crumbs?: Array<{ label: string; href: string }>;
    children?: React.ReactNode;
}) {
    return (
        <section className="border-b border-line bg-surface">
            <div className="shell pt-7 pb-14 sm:pt-8 sm:pb-16 lg:pb-[72px]">
                <nav aria-label={t('breadcrumb')} className="text-sm text-ink-muted">
                    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <li className="shrink-0">
                            <Link href={href(locale, 'home')} className="-my-2.5 inline-flex items-center gap-1.5 rounded-md py-2.5 transition-colors hover:text-primary-ink">
                                <House className="size-4 shrink-0" aria-hidden="true" />
                                {t('nav.home')}
                            </Link>
                        </li>
                        {crumbs.map((crumb) => (
                            <Crumb key={crumb.href}>
                                <Link href={crumb.href} className="-my-2.5 inline-block rounded-md py-2.5 transition-colors hover:text-primary-ink">
                                    {crumb.label}
                                </Link>
                            </Crumb>
                        ))}
                        <li className="shrink-0" aria-hidden="true">
                            <ChevronRight className="size-4 text-ink-subtle rtl:-scale-x-100" />
                        </li>
                        <li className="font-semibold text-ink max-sm:min-w-0 max-sm:flex-1 max-sm:truncate" aria-current="page">
                            {eyebrow ?? title}
                        </li>
                    </ol>
                </nav>

                <div className="mt-9 max-w-3xl sm:mt-11" data-reveal>
                    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
                    <h1 className={cx('text-[2rem] leading-[1.3] font-extrabold sm:text-[2.5rem] lg:text-5xl', eyebrow && 'mt-4')}>{title}</h1>
                    {lead && <p className="mt-4 max-w-[640px] text-[17px] text-ink-muted sm:text-[19px]">{lead}</p>}
                    {children}
                </div>
            </div>
        </section>
    );
}

function Crumb({ children }: { children: React.ReactNode }) {
    return (
        <>
            <li className="shrink-0" aria-hidden="true">
                <ChevronRight className="size-4 text-ink-subtle rtl:-scale-x-100" />
            </li>
            <li className="shrink-0">{children}</li>
        </>
    );
}
