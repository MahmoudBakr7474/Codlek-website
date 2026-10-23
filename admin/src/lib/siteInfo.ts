import { useEffect, useState } from 'react';
import { api } from './http';

export type SiteInfo = {
    siteUrl: string;
    founded: number;
    yearsOfExperience: number;
    contactEmail: string;
    contactPhone: string;
    notifyEmails: string[];
    mailDriver: string;
};

let cached: Promise<SiteInfo> | null = null;

/** The site's address and a few facts the help texts mention (loaded once). */
export function useSiteInfo(): SiteInfo | null {
    const [info, setInfo] = useState<SiteInfo | null>(null);

    useEffect(() => {
        cached ??= api<SiteInfo>('/site-info');
        cached.then(setInfo, () => {
            cached = null;
        });
    }, []);

    return info;
}

/** Drop the cached facts (after the contact page or the mail page saves). */
export function refreshSiteInfo() {
    cached = null;
}
