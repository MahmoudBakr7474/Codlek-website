import type { Metadata } from 'next';
import { LegalPage, legalDescription } from '@/components/legal/LegalPage';
import { pageContext } from '@/lib/page';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps<'/[locale]/terms'>): Promise<Metadata> {
    const { locale, site, t } = await pageContext(params);
    return pageMetadata({ locale, site, path: 'terms', title: t('legal.terms_title'), description: await legalDescription(locale, 'terms') });
}

export default async function TermsPage({ params }: PageProps<'/[locale]/terms'>) {
    const { locale, t } = await pageContext(params);
    return <LegalPage locale={locale} t={t} page="terms" />;
}
