import Link from 'next/link';
import { cx } from '@/lib/cx';

/*
 * Variants: primary · outline · soft · ghost · white and outline-light (for the
 * blue band) · whatsapp. Sizes: sm 40px · nav 44px (header bar, flat) · md 48px ·
 * lg 54px (hero) · xl 56px (the blue band). The big outline buttons are a little
 * narrower (24px sides instead of 28). The end icon is mirrored in RTL so arrows
 * follow the reading direction.
 */

export type Variant = 'primary' | 'outline' | 'soft' | 'ghost' | 'white' | 'outline-light' | 'whatsapp';
export type Size = 'sm' | 'nav' | 'md' | 'lg' | 'xl';
type Glyph = React.ComponentType<{ className?: string }>;

type Look = {
    variant?: Variant;
    size?: Size;
    icon?: Glyph;
    iconEnd?: Glyph;
    className?: string;
    children: React.ReactNode;
};

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md'): { box: string; glyph: string } {
    const base =
        'inline-flex select-none items-center justify-center whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-60';

    const variants: Record<Variant, string> = {
        primary: 'bg-primary font-bold text-on-primary hover:bg-primary-hover' + (size === 'nav' ? '' : ' shadow-primary'),
        outline: 'border-[1.5px] border-line-strong bg-surface font-bold text-ink hover:border-primary hover:text-primary-ink',
        soft: 'bg-primary-soft font-bold text-primary-ink hover:bg-primary-line/60',
        ghost: 'font-bold text-ink-soft hover:bg-surface-chip hover:text-ink',
        // White button on the blue band: dark text in both themes.
        white: 'bg-white font-extrabold text-navy hover:bg-on-primary-muted focus-visible:outline-white',
        'outline-light': 'border-[1.5px] border-on-primary-line font-bold text-white hover:border-white hover:bg-white/10 focus-visible:outline-white',
        whatsapp: 'bg-whatsapp font-bold text-white shadow-xs hover:bg-whatsapp-hover',
    };

    const bigSides = variant === 'outline' || variant === 'outline-light' ? 'px-6' : 'px-7';
    const [box, glyph] = {
        sm: ['h-10 gap-2 rounded-btn px-4 text-sm', 'size-4'],
        nav: ['h-11 gap-2 rounded-btn px-5 text-[15px]', 'size-[18px]'],
        md: ['h-12 gap-2 rounded-btn px-[22px] text-base', 'size-[18px]'],
        lg: [`h-[54px] gap-2.5 rounded-btn-lg ${bigSides} text-[17px]`, 'size-5'],
        xl: [`h-14 gap-2.5 rounded-btn-lg ${bigSides} text-[17px]`, 'size-5'],
    }[size];

    return { box: cx(base, variants[variant], box), glyph };
}

function Content({ icon: Start, iconEnd: End, glyph, children }: Pick<Look, 'icon' | 'iconEnd' | 'children'> & { glyph: string }) {
    return (
        <>
            {Start && <Start className={cx(glyph, 'shrink-0')} />}
            {children}
            {End && <End className={cx(glyph, 'shrink-0 rtl:-scale-x-100')} />}
        </>
    );
}

type LinkProps = Look & { href: string; external?: boolean } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children'>;

/** A link that looks like a button. `external` opens in a new tab. */
export function ButtonLink({ variant, size, icon, iconEnd, className, children, href, external, ...rest }: LinkProps) {
    const { box, glyph } = buttonClasses(variant, size);
    const content = <Content icon={icon} iconEnd={iconEnd} glyph={glyph}>{children}</Content>;

    return external ? (
        <a href={href} target="_blank" rel="noopener" className={cx(box, className)} {...rest}>
            {content}
        </a>
    ) : (
        <Link href={href} className={cx(box, className)} {...rest}>
            {content}
        </Link>
    );
}

type ButtonProps = Look & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

export function Button({ variant, size, icon, iconEnd, className, children, type = 'button', ...rest }: ButtonProps) {
    const { box, glyph } = buttonClasses(variant, size);
    return (
        <button type={type} className={cx(box, className)} {...rest}>
            <Content icon={icon} iconEnd={iconEnd} glyph={glyph}>{children}</Content>
        </button>
    );
}
