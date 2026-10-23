'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowRight, Briefcase, ChevronRight, House, Info, Layers, LayoutGrid, Mail, Menu, Moon, Newspaper, Sun, X, type LucideIcon } from 'lucide-react';
import { href, pages, type Locale, type Page } from '@/lib/i18n';
import { cx } from '@/lib/cx';
import { ButtonLink } from '../ui/Button';
import { IconTile } from '../ui/IconTile';
import { Logo } from '../ui/Logo';
import { useThemeToggle } from './theme';

const nav: Array<{ page: Page; icon: LucideIcon }> = [
    { page: 'home', icon: House },
    { page: 'about', icon: Info },
    { page: 'services', icon: Layers },
    { page: 'projects', icon: LayoutGrid },
    { page: 'blog', icon: Newspaper },
    { page: 'careers', icon: Briefcase },
    { page: 'contact', icon: Mail },
];

/** Width from which the header shows its nav pills (Tailwind `lg`). */
const DESKTOP_NAV = '(min-width: 1024px)';

export type HeaderLabels = {
    nav: Record<string, string>;
    navLabel: string;
    open: string;
    close: string;
    theme: string;
    langSwitch: string;
    langSwitchLabel: string;
    startProject: string;
    home: string;
};

/** The current path without the /en prefix ("/" for home). */
function pagePath(pathname: string): string {
    const path = pathname.replace(/^\/en(?=\/|$)/, '');
    return path === '' ? '/' : path;
}

function subscribeScroll(onChange: () => void) {
    window.addEventListener('scroll', onChange, { passive: true });
    return () => window.removeEventListener('scroll', onChange);
}

const scrolledPast = () => window.scrollY > 8;

/**
 * Sticky white bar: logo, nav pills (desktop), theme / language / CTA. Phones and
 * tablets get the menu button and a drop-down panel instead of the pills.
 */
export function Header({ locale, labels }: { locale: Locale; labels: HeaderLabels }) {
    const pathname = usePathname();
    const path = pagePath(pathname);
    // The menu is open for the page it was opened on, so a new page closes it.
    const [openOn, setOpenOn] = useState<string | null>(null);
    const open = openOn === pathname;
    const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
    const scrolled = useSyncExternalStore(subscribeScroll, scrolledPast, () => false);
    const menuButton = useRef<HTMLButtonElement>(null);
    const root = useRef<HTMLElement>(null);
    const { dark, toggle } = useThemeToggle();

    const otherLocale: Locale = locale === 'ar' ? 'en' : 'ar';
    const switchHref = otherLocale === 'en' ? `/en${path === '/' ? '' : path}` : path;

    useEffect(() => {
        document.documentElement.classList.toggle('overflow-hidden', open);
    }, [open]);

    // The phone / tablet menu closes when the window grows to the desktop layout.
    useEffect(() => {
        const desktop = window.matchMedia(DESKTOP_NAV);
        const onDesktop = (e: MediaQueryListEvent) => e.matches && setOpenOn(null);
        desktop.addEventListener('change', onDesktop);
        return () => desktop.removeEventListener('change', onDesktop);
    }, []);

    // Escape closes the open menu and hands focus back to its button (not <body>).
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpenOn(null);
                menuButton.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const isActive = (page: Page) => {
        const target = pages[page] || '/';
        return target === '/' ? path === '/' : path === target || path.startsWith(`${target}/`);
    };

    const square =
        'grid size-11 shrink-0 place-items-center rounded-btn border border-line bg-surface text-ink-soft transition-colors hover:border-line-strong hover:bg-surface-chip hover:text-ink';

    return (
        <header
            ref={root}
            onBlur={(e) => {
                // Tabbing past the last link (or clicking elsewhere) closes the open menu.
                if (open && !root.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
            }}
            className={cx('sticky top-0 z-50 border-b border-line bg-surface transition-shadow duration-300', scrolled && !open ? 'shadow-xs' : 'shadow-none')}
        >
            <div className="shell flex h-16 items-center justify-between gap-2 sm:gap-3 lg:h-[72px] xl:gap-4">
                <Link href={href(locale, 'home')} className="-my-1.5 shrink-0 rounded-btn py-1.5" aria-label={labels.home}>
                    <Logo size="none" className="h-8 sm:h-9" />
                </Link>

                <nav className="hidden min-w-0 items-center gap-0.5 lg:flex xl:gap-1" aria-label={labels.navLabel}>
                    {nav.map(({ page }) => {
                        const active = isActive(page);
                        return (
                            <Link
                                key={page}
                                href={href(locale, page)}
                                aria-current={path === (pages[page] || '/') ? 'page' : undefined}
                                className={cx(
                                    'rounded-chip px-2.5 py-2 text-[15px] whitespace-nowrap transition-colors xl:px-3.5',
                                    active ? 'bg-primary-soft font-bold text-primary-ink' : 'font-semibold text-ink-soft hover:bg-surface-chip hover:text-ink',
                                )}
                            >
                                {labels.nav[page]}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <button type="button" className={cx(square, 'max-[360px]:hidden')} onClick={toggle} aria-pressed={dark} aria-label={labels.theme} title={labels.theme}>
                        <Moon className="size-5 dark:hidden" aria-hidden="true" />
                        <Sun className="hidden size-5 dark:block" aria-hidden="true" />
                    </button>

                    {/* A plain link: the other language is another root layout, loaded in full. */}
                    <a
                        href={switchHref}
                        hrefLang={otherLocale}
                        lang={otherLocale}
                        aria-label={labels.langSwitchLabel}
                        className="inline-flex h-11 shrink-0 items-center rounded-btn border border-line bg-surface px-3 text-sm font-bold whitespace-nowrap text-ink-soft transition-colors hover:border-line-strong hover:bg-surface-chip hover:text-ink xl:px-3.5"
                    >
                        {labels.langSwitch}
                    </a>

                    {/* Wrapped: the button's own inline-flex would override `hidden`. */}
                    <div className="hidden sm:block">
                        <ButtonLink href={href(locale, 'contact')} size="nav" className="lg:max-xl:px-4">
                            {labels.startProject}
                        </ButtonLink>
                    </div>

                    <button
                        type="button"
                        ref={menuButton}
                        className={cx(square, 'lg:hidden')}
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                        aria-controls="mobile-nav"
                        aria-label={open ? labels.close : labels.open}
                    >
                        {open ? <X className="size-[22px]" aria-hidden="true" /> : <Menu className="size-[22px]" aria-hidden="true" />}
                    </button>
                </div>
            </div>

            {/* Phone / tablet menu: drops under the bar over a dimmed page. */}
            <div
                onClick={() => setOpen(false)}
                aria-hidden="true"
                className={cx(
                    'absolute inset-x-0 top-full h-dvh bg-navy/40 transition-opacity duration-200 lg:hidden dark:bg-black/60',
                    open ? 'opacity-100' : 'pointer-events-none invisible opacity-0',
                )}
            />

            <div
                id="mobile-nav"
                className={cx(
                    'absolute inset-x-0 top-full border-b border-line bg-surface shadow-float transition duration-200 ease-out lg:hidden',
                    open ? 'translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-2 opacity-0',
                )}
            >
                <nav className="shell max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain pt-3 pb-5" aria-label={labels.navLabel}>
                    <ul className="grid gap-1 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-1.5">
                        {nav.map(({ page, icon }) => {
                            const active = isActive(page);
                            return (
                                <li key={page}>
                                    <Link
                                        href={href(locale, page)}
                                        onClick={() => setOpen(false)}
                                        aria-current={path === (pages[page] || '/') ? 'page' : undefined}
                                        className={cx(
                                            'flex items-center gap-3 rounded-btn p-2 pe-3 text-base transition-colors',
                                            active ? 'bg-primary-soft font-bold text-primary-ink' : 'font-semibold text-ink hover:bg-surface-chip',
                                        )}
                                    >
                                        <IconTile icon={icon} size="sm" tone={active ? 'solid' : 'blue'} />
                                        <span className="min-w-0 flex-1">{labels.nav[page]}</span>
                                        <ChevronRight className="size-[18px] shrink-0 text-ink-subtle rtl:-scale-x-100" aria-hidden="true" />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:hidden">
                        <ButtonLink href={href(locale, 'contact')} size="lg" iconEnd={ArrowRight} className="w-full" onClick={() => setOpen(false)}>
                            {labels.startProject}
                        </ButtonLink>
                        {/* The bar has no room for the theme button on the narrowest phones. */}
                        <button
                            type="button"
                            onClick={toggle}
                            aria-pressed={dark}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-btn border border-line text-[15px] font-bold text-ink-soft transition-colors hover:bg-surface-chip min-[360px]:hidden"
                        >
                            <Moon className="size-5 dark:hidden" aria-hidden="true" />
                            <Sun className="hidden size-5 dark:block" aria-hidden="true" />
                            {labels.theme}
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
}
