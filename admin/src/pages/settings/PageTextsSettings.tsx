import { FormTabs } from '../../components/form/FormTabs';
import { Section } from '../../components/form/Section';
import { SettingsPage } from '../../components/settings/SettingsPage';
import { TextFields, type TextSpec } from '../../components/settings/TextFields';

type PageGroup = { key: string; label: string; sections: Array<{ heading: string; description: string; fields: Record<string, TextSpec> }> };

/** The first block of an inner page: eyebrow, title and lead. */
function hero(page: string, name: string) {
    return {
        heading: 'أول الصفحة',
        description: `الكلمة الصغيرة والعنوان والوصف اللي في أول ${name}.`,
        fields: {
            [`${page}.hero.eyebrow`]: 'الكلمة الصغيرة فوق العنوان',
            [`${page}.hero.title`]: { label: 'العنوان', hint: 'وهو كمان اسم الصفحة في تبويب المتصفح وجوجل.' },
            [`${page}.hero.lead`]: { label: 'الوصف', textarea: true, hint: 'بيظهر كمان كوصف الصفحة في نتايج جوجل.' },
        } as Record<string, TextSpec>,
    };
}

const PAGES: PageGroup[] = [
    {
        key: 'services',
        label: 'الخدمات',
        sections: [
            hero('services', 'صفحة الخدمات'),
            { heading: 'زرار كل خدمة', description: 'الزرار اللي تحت كل خدمة وبيودّي على فورم التواصل والخدمة مختارة.', fields: { 'services.quote': 'زرار طلب عرض السعر' } },
        ],
    },
    {
        key: 'projects',
        label: 'الأعمال',
        sections: [
            hero('projects', 'صفحة الأعمال'),
            { heading: 'لما مفيش مشاريع', description: 'الرسالة اللي بتظهر لما الزائر يختار مجال مفيهوش مشاريع.', fields: { 'projects.empty': { label: 'الرسالة', textarea: true } } },
        ],
    },
    {
        key: 'blog',
        label: 'المدونة',
        sections: [
            hero('blog', 'صفحة المدونة'),
            {
                heading: 'باقي نصوص المدونة',
                description: 'رسالة المدونة الفاضية، والعنوان والكارت اللي في آخر كل مقال.',
                fields: {
                    'blog.empty': { label: 'الرسالة لما مفيش مقالات منشورة', textarea: true },
                    'blog.related': 'عنوان المقالات المقترحة تحت المقال',
                    'blog.share_cta_title': 'عنوان الكارت اللي في آخر المقال',
                    'blog.share_cta_text': { label: 'نص الكارت اللي في آخر المقال', textarea: true },
                },
            },
        ],
    },
    {
        key: 'careers',
        label: 'الوظائف',
        sections: [
            hero('careers', 'صفحة الوظائف'),
            {
                heading: 'الوظائف والتقديم',
                description: 'عنوان قائمة الوظائف، والرسالة لما مفيش وظايف، وفورم التقديم.',
                fields: {
                    'careers.open_positions': 'عنوان قائمة الوظائف',
                    'careers.no_jobs': { label: 'الرسالة لما مفيش وظايف متاحة', textarea: true },
                    'careers.apply_title': 'عنوان فورم التقديم',
                    'careers.apply_lead': { label: 'الجملة تحت عنوان الفورم', textarea: true },
                    'careers.general': { label: 'اختيار التقديم العام في قائمة الوظائف بالفورم', hint: 'للي عايز يقدّم من غير وظيفة معيّنة.' },
                },
            },
        ],
    },
    {
        key: 'contact',
        label: 'التواصل',
        sections: [
            hero('contact', 'صفحة التواصل'),
            {
                heading: 'الفورم وواتساب والسوشيال',
                description: 'عنوان فورم التواصل، وكارت واتساب، وعنوان حسابات السوشيال.',
                fields: {
                    'contact.form_title': 'عنوان الفورم',
                    'contact.form_lead': { label: 'الجملة تحت عنوان الفورم', textarea: true },
                    'contact.whatsapp_title': 'عنوان كارت واتساب',
                    'contact.whatsapp_text': { label: 'نص كارت واتساب', textarea: true },
                    'contact.whatsapp_button': 'زرار واتساب',
                    'contact.follow': 'العنوان فوق حسابات السوشيال',
                },
            },
        ],
    },
    {
        key: 'general',
        label: 'أزرار ونصوص عامة',
        sections: [
            {
                heading: 'الأزرار',
                description: 'أزرار بتتكرر في أكتر من مكان في الموقع، بالعربي والإنجليزي.',
                fields: {
                    'cta.start_project': 'زرار الهيدر (فوق في كل الصفحات)',
                    'cta.start_now': 'الزرار الأساسي في أول الصفحة الرئيسية',
                    'cta.see_work': 'زرار الأعمال في أول الصفحة الرئيسية',
                    'cta.consult': { label: 'زرار الاستشارة المجانية', hint: 'في الشريط اللي في آخر الصفحات وفي آخر كل مقال.' },
                    'cta.quote': { label: 'زرار طلب عرض السعر', hint: 'في الشريط اللي في آخر الصفحات.' },
                    'cta.all_projects': 'زرار صفحة الأعمال تحت قسم المشاريع في الرئيسية',
                    'cta.about_more': 'زرار صفحة «من نحن» في قسم المميزات بالرئيسية',
                },
            },
            {
                heading: 'رسايل بعد الإرسال',
                description: 'اللي بيظهر للزائر بعد ما يبعت فورم التواصل أو يقدّم على وظيفة.',
                fields: {
                    'forms.contact_success_title': 'عنوان رسالة فورم التواصل',
                    'forms.contact_success_text': { label: 'نص رسالة فورم التواصل', textarea: true },
                    'forms.apply_success_title': 'عنوان رسالة التقديم على وظيفة',
                    'forms.apply_success_text': { label: 'نص رسالة التقديم على وظيفة', textarea: true },
                },
            },
        ],
    },
];

const TEXT_KEYS = PAGES.flatMap((page) => page.sections.flatMap((section) => Object.keys(section.fields)));

export function PageTextsSettings() {
    return (
        <SettingsPage title="نصوص الصفحات" settingKeys={[]} textKeys={TEXT_KEYS}>
            <FormTabs
                items={PAGES.map((page) => ({
                    key: page.key,
                    label: page.label,
                    children: page.sections.map((section) => (
                        <Section key={section.heading} title={section.heading} description={section.description}>
                            <TextFields fields={section.fields} />
                        </Section>
                    )),
                }))}
            />
        </SettingsPage>
    );
}
