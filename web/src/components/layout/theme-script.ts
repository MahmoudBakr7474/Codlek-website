export const THEME_KEY = 'codlek-theme';

/** Browser bar colour = the header's surface. */
export const THEME_COLORS = { light: '#FFFFFF', dark: '#0F1F40' };

/**
 * Runs in <head> before first paint (no light/dark flash): the visitor's own
 * choice, else the admin's default (light / dark / like the device). Also marks
 * <html> with .js, which the scroll-reveal CSS keys on.
 */
export function themeScript(fallback: string): string {
    return `(function(){var r=document.documentElement;r.classList.add('js');var f=${JSON.stringify(fallback)};var s=null;try{s=localStorage.getItem('${THEME_KEY}')}catch(e){}var d=s?s==='dark':f==='dark'||(f==='system'&&!!window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){r.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.content='${THEME_COLORS.dark}'}})();`;
}
