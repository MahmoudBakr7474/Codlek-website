import {
    siBehance,
    siDribbble,
    siFacebook,
    siGithub,
    siInstagram,
    siSnapchat,
    siTelegram,
    siThreads,
    siTiktok,
    siWhatsapp,
    siX,
    siYoutube,
    type SimpleIcon,
} from 'simple-icons';

/*
 * Social platform glyphs. Filled brand logos come from Simple Icons; Lucide 1.x
 * no longer ships brand icons and Simple Icons has no LinkedIn, so the outline
 * versions the design uses in the footer are drawn here with Lucide's old paths
 * (ISC licence). Small and client-safe.
 */

type GlyphProps = { className?: string };

function Filled({ icon, className }: { icon: SimpleIcon } & GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d={icon.path} />
        </svg>
    );
}

function Outline({ children, className }: { children: React.ReactNode } & GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
            {children}
        </svg>
    );
}

export function WhatsAppIcon({ className }: GlyphProps) {
    return <Filled icon={siWhatsapp} className={className} />;
}

export function LinkedInOutline({ className }: GlyphProps) {
    return (
        <Outline className={className}>
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect width="4" height="12" x="2" y="9" />
            <circle cx="4" cy="4" r="2" />
        </Outline>
    );
}

const outlines: Record<string, (props: GlyphProps) => React.ReactElement> = {
    facebook: ({ className }) => (
        <Outline className={className}>
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </Outline>
    ),
    instagram: ({ className }) => (
        <Outline className={className}>
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </Outline>
    ),
    linkedin: LinkedInOutline,
    youtube: ({ className }) => (
        <Outline className={className}>
            <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
            <path d="m10 15 5-3-5-3z" />
        </Outline>
    ),
    github: ({ className }) => (
        <Outline className={className}>
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
        </Outline>
    ),
    dribbble: ({ className }) => (
        <Outline className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" />
            <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" />
            <path d="M8.56 2.75c4.37 6 6 9.42 8 17.72" />
        </Outline>
    ),
};

const filled: Record<string, SimpleIcon> = {
    facebook: siFacebook,
    instagram: siInstagram,
    x: siX,
    tiktok: siTiktok,
    youtube: siYoutube,
    behance: siBehance,
    dribbble: siDribbble,
    snapchat: siSnapchat,
    telegram: siTelegram,
    threads: siThreads,
    github: siGithub,
};

/** The brand logo of a platform (LinkedIn in outline, as the Laravel site). */
export function SocialIcon({ platform, className }: { platform: string } & GlyphProps) {
    if (platform === 'linkedin') {
        return <LinkedInOutline className={className} />;
    }

    const icon = filled[platform];
    return icon ? <Filled icon={icon} className={className} /> : null;
}

/** The footer's outline version where one exists, else the brand logo. */
export function SocialOutline({ platform, className }: { platform: string } & GlyphProps) {
    const Glyph = outlines[platform];
    return Glyph ? <Glyph className={className} /> : <SocialIcon platform={platform} className={className} />;
}

export function hasOutline(platform: string): boolean {
    return platform in outlines;
}

/** The colour of a platform's tile in the quick-contact menu. */
export const socialTiles: Record<string, string> = {
    facebook: 'bg-[#1877F2] text-white',
    instagram: 'bg-linear-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white',
    linkedin: 'bg-[#0A66C2] text-white',
    x: 'bg-[#0F1419] text-white',
    tiktok: 'bg-[#0F1419] text-white',
    youtube: 'bg-[#E62117] text-white',
    behance: 'bg-[#1769FF] text-white',
    dribbble: 'bg-[#C32361] text-white',
    snapchat: 'bg-[#FFFC00] text-[#0F1419]',
    telegram: 'bg-[#1C8ADB] text-white',
    threads: 'bg-[#0F1419] text-white',
    github: 'bg-[#0F1419] text-white',
};
