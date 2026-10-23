import type { I18nProvider } from '@refinedev/core';

/** Refine's own words (buttons, notifications…) in Egyptian Arabic, like the Filament panel. */
const ar: Record<string, string> = {
    'buttons.create': 'إضافة',
    'buttons.save': 'حفظ',
    'buttons.edit': 'تعديل',
    'buttons.delete': 'مسح',
    'buttons.show': 'عرض',
    'buttons.list': 'القائمة',
    'buttons.cancel': 'إلغاء',
    'buttons.confirm': 'متأكد؟',
    'buttons.refresh': 'تحديث',
    'buttons.filter': 'فلترة',
    'buttons.clear': 'مسح الفلتر',
    'buttons.logout': 'تسجيل الخروج',
    'buttons.clone': 'نسخ',
    'buttons.import': 'استيراد',
    'buttons.export': 'تصدير',
    'buttons.notAccessTitle': 'مش مسموح',
    'notifications.success': 'تمام',
    'notifications.error': 'حصلت مشكلة',
    'notifications.createSuccess': 'اتضاف.',
    'notifications.editSuccess': 'اتحفظت التغييرات.',
    'notifications.deleteSuccess': 'اتمسح.',
    'notifications.createError': 'الإضافة ما نفعتش.',
    'notifications.editError': 'الحفظ ما نفعش.',
    'notifications.deleteError': 'المسح ما نفعش.',
    'pages.error.404': 'الصفحة دي مش موجودة.',
    'pages.error.backHome': 'رجوع للوحة التحكم',
    'pages.error.info': 'يمكن الرابط اتغير أو اتكتب غلط.',
    'warnWhenUnsavedChanges': 'فيه تغييرات مش محفوظة. متأكد إنك عايز تخرج من الصفحة؟',
    'documentTitle.default': 'لوحة تحكم كودلك',
    'documentTitle.suffix': ' | لوحة تحكم كودلك',
};

export const i18nProvider: I18nProvider = {
    translate: (key: string, options?: unknown, defaultMessage?: string) => {
        const fallback = typeof options === 'string' ? options : defaultMessage;
        return ar[key] ?? fallback ?? key;
    },
    changeLocale: async () => undefined,
    getLocale: () => 'ar',
};
