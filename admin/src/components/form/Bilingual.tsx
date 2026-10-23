import type { ReactNode } from 'react';
import { FormTabs } from './FormTabs';
import type { Lang } from './lang';

/**
 * "العربية / English" tabs for the *Ar / *En fields. Both tabs are rendered, so
 * their fields are validated and saved even when the other tab is open.
 */
export function Bilingual({ children }: { children: (lang: Lang) => ReactNode }) {
    return (
        <FormTabs
            size="small"
            items={[
                { key: 'ar', label: 'العربية', children: children('ar') },
                { key: 'en', label: 'English', children: children('en') },
            ]}
        />
    );
}
