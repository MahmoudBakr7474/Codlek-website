import { Card, Form, Space, Typography } from 'antd';
import { ImageUpload } from '../../components/form/ImageUpload';
import { Section } from '../../components/form/Section';
import { useSettings } from '../../components/settings/context';
import { SettingsPage } from '../../components/settings/SettingsPage';
import { TextFields } from '../../components/settings/TextFields';
import { useSiteInfo } from '../../lib/siteInfo';

const TEXT_KEYS = ['meta.default_title', 'meta.default_description', 'meta.keywords'];

/** How the home page looks in Google, in both languages, updated while typing. */
function SearchPreview() {
    const form = Form.useFormInstance();
    const { original } = useSettings();
    const site = useSiteInfo();
    const texts = Form.useWatch('texts', form) as Record<'ar' | 'en', Record<string, string>> | undefined;

    return (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {(['ar', 'en'] as const).map((lang) => {
                const text = (key: string) => texts?.[lang]?.[key]?.trim() || original(lang, key);
                const title = text('meta.default_title');
                const description = text('meta.default_description').replace(':founded', String(site?.founded ?? ''));
                const url = (site?.siteUrl ?? '').replace(/^https?:\/\//, '') + (lang === 'en' ? '/en' : '');
                return (
                    <Card size="small" key={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }} dir="ltr">
                            {url}
                        </Typography.Text>
                        <div style={{ color: '#1a0dab', fontSize: 18, lineHeight: 1.4, margin: '2px 0' }}>{title}</div>
                        <div style={{ color: '#4d5156', fontSize: 14 }}>{description}</div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {lang === 'ar' ? 'العربي' : 'English'} · {[...title].length} حرف في العنوان · {[...description].length} حرف في الوصف
                        </Typography.Text>
                    </Card>
                );
            })}
        </Space>
    );
}

export function SeoSettings() {
    return (
        <SettingsPage title="الظهور في جوجل والمشاركة" settingKeys={['seo.og_image']} textKeys={TEXT_KEYS} viewPath="/">
            <Section title="عنوان الموقع ووصفه" description="بيظهروا في نتيجة البحث في جوجل للصفحة الرئيسية، وفي أي صفحة مالهاش وصف خاص بيها.">
                <TextFields
                    fields={{
                        'meta.default_title': { label: 'عنوان الموقع', hint: 'الأفضل أقل من 60 حرف، وفيه اسم الشركة وأهم خدمة.' },
                        'meta.default_description': { label: 'وصف الموقع', textarea: true, hint: 'من 120 لـ 160 حرف. الكلمة :founded بتتبدل بسنة التأسيس.' },
                        'meta.keywords': { label: 'كلمات مفتاحية', textarea: true, hint: 'كلمات مفصولة بفواصل. جوجل مش بيعتمد عليها كتير، لكن بعض المحركات التانية بتقراها.' },
                    }}
                />
            </Section>

            <Section title="معاينة نتيجة البحث" description="شكل الصفحة الرئيسية في جوجل بالعربي والإنجليزي، وبتتحدث وانت بتكتب.">
                <SearchPreview />
            </Section>

            <Section title="صورة المشاركة" description="الصورة اللي بتظهر لما حد يشارك لينك الموقع على واتساب أو فيسبوك أو لينكدإن. المقالات بتستخدم صورة غلافها لو ليها.">
                <Form.Item name={['settings', 'seo.og_image']} label="الصورة" extra="المقاس المثالي 1200×630. من غيرها بتظهر الصورة الأصلية بلوجو كودلك.">
                    <SeoImage />
                </Form.Item>
            </Section>
        </SettingsPage>
    );
}

function SeoImage(props: { value?: string | null; onChange?: (value: string | null) => void }) {
    const site = useSiteInfo();
    return <ImageUpload {...props} preset="seo" aspect="1200 / 630" fallback={site ? `${site.siteUrl}/images/og-cover.png` : undefined} />;
}
