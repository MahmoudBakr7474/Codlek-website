import { Alert, Col, Form, Input, Row, Typography } from 'antd';
import { FormTabs } from '../../components/form/FormTabs';
import { Hint } from '../../components/form/Hint';
import { ListEditor } from '../../components/form/ListEditor';
import { pairLabel } from '../../components/form/lang';
import { Pair } from '../../components/form/Pair';
import { Section } from '../../components/form/Section';
import { SettingsPage } from '../../components/settings/SettingsPage';
import { TextFields } from '../../components/settings/TextFields';
import { useSiteInfo } from '../../lib/siteInfo';

const SETTING_KEYS = ['legal.privacy', 'legal.terms'];
const TEXT_KEYS = ['legal.privacy_title', 'legal.terms_title', 'legal.updated'];

/** Sections of a legal page: a title, an optional text and optional bullet points. */
function SectionsEditor({ name }: { name: string }) {
    return (
        <ListEditor
            name={['settings', name]}
            addLabel="إضافة قسم"
            min={1}
            foldAfter={0}
            newItem={{ title: { ar: '', en: '' }, text: { ar: '', en: '' }, items: [] }}
            itemTitle={(value, index) => `${index + 1}. ${pairLabel(value?.title) || 'قسم جديد'}`}
        >
            {(field) => (
                <>
                    <Pair name={[field.name, 'title']} label="عنوان القسم" max={150} />
                    <Pair name={[field.name, 'text']} label="نص القسم" required={false} textarea rows={3} max={3000} hint="اختياري. {email} بيتكتب مكانه إيميل التواصل." />
                    <Typography.Text type="secondary">نقاط (اختياري): بتظهر كقائمة نقاط تحت النص.</Typography.Text>
                    <div style={{ marginTop: 8 }}>
                        <ListEditor name={[field.name, 'items']} addLabel="إضافة نقطة" foldAfter={99} newItem={{ ar: '', en: '' }} itemTitle={(value, i) => pairLabel(value) || `نقطة ${i + 1}`}>
                            {(point) => (
                                <Row gutter={12}>
                                    <Col xs={24} md={12}>
                                        <Form.Item name={[point.name, 'ar']} label="بالعربي" rules={[{ required: true, message: 'الحقل ده مطلوب.' }]}>
                                            <Input maxLength={500} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name={[point.name, 'en']} label="English" rules={[{ required: true, message: 'الحقل ده مطلوب.' }]}>
                                            <Input maxLength={500} dir="ltr" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}
                        </ListEditor>
                    </div>
                </>
            )}
        </ListEditor>
    );
}

export function LegalSettings() {
    const site = useSiteInfo();

    return (
        <SettingsPage title="سياسة الخصوصية والشروط والأحكام" settingKeys={SETTING_KEYS} textKeys={TEXT_KEYS} viewPath="/privacy">
            <Alert
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
                message="قبل ما تعدّل"
                description={
                    <Hint
                        text={`نص أول قسم في كل صفحة (المقدمة) بيظهر كمان كوصف الصفحة في نتايج جوجل وعند مشاركة الرابط، فخليه جملة أو اتنين بيلخّصوا الصفحة. اكتب {email} في أي نص وهيتكتب مكانه إيميل التواصل (دلوقتي ${site?.contactEmail ?? ''})، و{phone} للتليفون.`}
                    />
                }
            />

            <Section title="آخر تحديث" description="السطر اللي تحت العنوان في الصفحتين. حدّثه كل ما تغيّر حاجة في السياسة أو الشروط.">
                <TextFields fields={{ 'legal.updated': 'سطر «آخر تحديث» (للصفحتين)' }} />
            </Section>

            <FormTabs
                items={[
                    {
                        key: 'privacy',
                        label: 'سياسة الخصوصية',                        children: (
                            <>
                                <Section title="عنوان الصفحة" description="العنوان الكبير في أول الصفحة، وهو كمان اسم الصفحة في تبويب المتصفح وجوجل.">
                                    <TextFields fields={{ 'legal.privacy_title': 'العنوان' }} />
                                </Section>
                                <Section title="أقسام الصفحة" description="بتظهر مرقّمة بنفس الترتيب هنا، ولها فهرس جانبي على الكمبيوتر. لكل قسم عنوان، ونص و/أو نقاط.">
                                    <SectionsEditor name="legal.privacy" />
                                </Section>
                            </>
                        ),
                    },
                    {
                        key: 'terms',
                        label: 'الشروط والأحكام',                        children: (
                            <>
                                <Section title="عنوان الصفحة" description="العنوان الكبير في أول الصفحة، وهو كمان اسم الصفحة في تبويب المتصفح وجوجل.">
                                    <TextFields fields={{ 'legal.terms_title': 'العنوان' }} />
                                </Section>
                                <Section title="أقسام الصفحة" description="بتظهر مرقّمة بنفس الترتيب هنا، ولها فهرس جانبي على الكمبيوتر.">
                                    <SectionsEditor name="legal.terms" />
                                </Section>
                            </>
                        ),
                    },
                ]}
            />
        </SettingsPage>
    );
}
