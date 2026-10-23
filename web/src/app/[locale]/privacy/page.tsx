import type { Metadata } from 'next';
import { LegalPage, legalDescription } from '@/components/legal/LegalPage';
import { pageContext } from '@/lib/page';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
    const { locale, site, t } = await pageContext(params);
    return pageMetadata({ locale, site, path: 'privacy', title: t('legal.privacy_title'), description: await legalDescription(locale, 'privacy') });
}

export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
    const { locale, t } = await pageContext(params);
    return <LegalPage locale={locale} t={t} page="privacy" />;
}
