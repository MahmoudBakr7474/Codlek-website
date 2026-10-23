import Link from 'next/link';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { currentYear, type SiteData } from '@/lib/api';
import { href, type Locale, type Page, type Translate } from '@/lib/i18n';
import { cx } from '@/lib/cx';
import { hasOutline, SocialOutline } from '../ui/BrandIcons';
import { IconTile } from '../ui/IconTile';
import { Logo } from '../ui/Logo';

const links: Page[] = ['about', 'services', 'projects', 'blog', 'careers', 'contact'];

/*
 * White footer: brand + blurb + social squares, quick links, services, contact rows;
 * then the copyright bar. Columns: phones = brand, then quick links | services side
 * by side, then contact; tablets = 2 x 2; from `lg` four columns sized to their
 * content (the design's 4 equal columns broke into 3 + 1 between 788 and 1047px).
 */
export async function Footer({ locale, t, site }: { locale: Locale; t: Translate; site: SiteData }) {
    const year = await currentYear();
    const services = site.services.slice(0, 6);

    const square =
        'grid size-11 place-items-center rounded-btn border border-line bg-surface text-ink-soft transition-colors hover:border-primary-line hover:bg-primary-soft hover:text-primary-ink';
    // Phones and tablets: 44px tall rows (touch targets). From `lg`, the design's rows, 10px apart.
    const list = 'flex flex-col items-start text-[15px] lg:gap-2.5';
    const link = 'inline-flex min-h-11 items-center rounded-md text-ink-muted transition-colors hover:text-primary-ink lg:min-h-0';
    // py + the same negative margin: a 44px tall hit area on the small bottom-bar links.
    const barLink = '-my-2.5 inline-block rounded-md py-2.5 transition-colors hover:text-primary-ink';

    return (
        <footer className="border-t border-line bg-surface">
            <div className="shell grid grid-cols-2 gap-x-6 gap-y-10 pt-16 pb-8 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-8 xl:gap-10">
                <div className="col-span-2 flex flex-col items-start gap-3.5 sm:col-span-1">
                    <Link href={href(locale, 'home')} className="rounded-btn" aria-label={t('brand')}>
                        <Logo />
                    </Link>
                    <p className="max-w-sm text-[15px] text-ink-muted">{t('footer.blurb')}</p>
                    <div className="flex flex-wrap items-center gap-2">
                        {site.socials.map((social) => (
                            <a key={social.url} href={social.url} target="_blank" rel="noopener" aria-label={social.label} className={square}>
                                <SocialOutline platform={social.platform} className={hasOutline(social.platform) ? 'size-5' : 'size-[18px]'} />
                            </a>
                        ))}
                        <a href={`https://wa.me/${site.contact.whatsapp}`} target="_blank" rel="noopener" aria-label={t('social.whatsapp')} className={square}>
                            <MessageCircle className="size-5" aria-hidden="true" />
                        </a>
                    </div>
                </div>

                <nav className={cx('flex flex-col gap-2.5', services.length === 0 && 'col-span-2 sm:col-span-1')} aria-label={t('footer.quick_links')}>
                    <h2 className="text-[17px] leading-[1.7] font-extrabold">{t('footer.quick_links')}</h2>
                    <ul className={list}>
                        {links.map((page) => (
                            <li key={page}>
                                <Link href={href(locale, page)} className={link}>
                                    {t(`nav.${page}`)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {services.length > 0 && (
                    <nav className="flex flex-col gap-2.5" aria-label={t('footer.services')}>
                        <h2 className="text-[17px] leading-[1.7] font-extrabold">{t('footer.services')}</h2>
                        <ul className={list}>
                            {services.map((service) => (
                                <li key={service.key}>
                                    <Link href={href(locale, 'services', undefined, service.key)} className={link}>
                                        {service.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}

                <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
                    <h2 className="text-[17px] leading-[1.7] font-extrabold">{t('footer.contact')}</h2>
                    <ul className="flex flex-col items-start gap-3 text-[15px] text-ink-soft">
                        <li>
                            <a href={`mailto:${site.contact.email}`} className="group flex min-h-11 items-center gap-2.5 rounded-btn transition-colors hover:text-primary-ink lg:min-h-0">
                                <IconTile icon={Mail} size="sm" />
                                <span className="break-all" dir="ltr">
                                    {site.contact.email}
                                </span>
                            </a>
                        </li>
                        <li>
                            <a href={`tel:${site.contact.phoneInternational}`} className="group flex min-h-11 items-center gap-2.5 rounded-btn transition-colors hover:text-primary-ink lg:min-h-0">
                                <IconTile icon={Phone} size="sm" />
                                <span dir="ltr">{site.contact.phone}</span>
                            </a>
                        </li>
                        <li className="flex items-center gap-2.5">
                            <IconTile icon={MapPin} size="sm" />
                            <span>{t('footer.location')}</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* data-footer-end: room under this row while the floating contact button is on the page. */}
            <div className="shell">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line py-5 text-sm text-ink-muted" data-footer-end>
                    <p>
                        © {year} Codlek. {t('footer.rights')}
                    </p>
                    <div className="flex items-center gap-5">
                        <Link href={href(locale, 'privacy')} className={barLink}>
                            {t('footer.privacy')}
                        </Link>
                        <Link href={href(locale, 'terms')} className={barLink}>
                            {t('footer.terms')}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
