import { createContext, useContext } from 'react';

export type SettingsContextValue = {
    /** The shipped text of a page text, shown as its placeholder. */
    original: (lang: 'ar' | 'en', key: string) => string;
    defaults: Record<string, unknown>;
};

export const SettingsContext = createContext<SettingsContextValue>({ original: () => '', defaults: {} });

export const useSettings = () => useContext(SettingsContext);
