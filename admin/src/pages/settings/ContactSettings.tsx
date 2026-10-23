import { MailOutlined, MobileOutlined } from '@ant-design/icons';
import { Col, Form, Input, InputNumber, Row, Select } from 'antd';
import { Hint } from '../../components/form/Hint';
import { ListEditor } from '../../components/form/ListEditor';
import { Section } from '../../components/form/Section';
import { SettingsPage } from '../../components/settings/SettingsPage';
import { TextFields } from '../../components/settings/TextFields';

const SETTING_KEYS = ['contact.email', 'contact.phone', 'contact.phone_international', 'contact.whatsapp', 'company.founded', 'social.links'];
const TEXT_KEYS = ['contact.location_value', 'footer.location', 'footer.blurb'];

/** The platforms the site has icons for, by their Arabic name. */
const PLATFORMS: Record<string, string> = {
    facebook: 'فيسبوك',
    instagram: 'إنستجرام',
    linkedin: 'لينكدإن',
    x: 'إكس',
    tiktok: 'تيك توك',
    youtube: 'يوتيوب',
    behance: 'بيهانس',
    dribbble: 'دريبل',
    snapchat: 'سناب شات',
    telegram: 'تيليجرام',
    threads: 'ثريدز',
    github: 'جيت هب',
};

const required = [{ required: true, message: 'الحقل ده مطلوب.' }];

export function ContactSettings() {
    return (
        <SettingsPage title="بيانات التواصل والسوشيال" settingKeys={SETTING_KEYS} textKeys={TEXT_KEYS} viewPath="/contact">
            <Section title="طرق التواصل" description="بتظهر في صفحة التواصل والفوتر وزرار التواصل السريع، وبتوصل عليها رسائل العملاء.">
                <Form.Item name={['settings', 'contact.email']} label="البريد الإلكتروني" rules={[...required, { type: 'email', message: 'الإيميل مكتوب غلط.' }]}>
                    <Input prefix={<MailOutlined />} maxLength={254} dir="ltr" />
                </Form.Item>
                <Row gutter={12}>
                    <Col xs={24} md={12}>
                        <Form.Item name={['settings', 'contact.phone']} label="رقم التليفون (زي ما يظهر)" rules={required} extra={<Hint text="مثلاً 01144745671" />}>
                            <Input maxLength={30} dir="ltr" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name={['settings', 'contact.phone_international']}
                            label="الرقم بكود الدولة (للاتصال)"
                            rules={[...required, { pattern: /^\+[1-9][0-9]{7,14}$/, message: 'اكتب الرقم بالشكل ده: + وبعدها كود الدولة والرقم من غير مسافات.' }]}
                            extra={<Hint text="مثلاً +201144745671" />}
                        >
                            <Input maxLength={16} dir="ltr" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item
                    name={['settings', 'contact.whatsapp']}
                    label="رقم واتساب"
                    rules={[...required, { pattern: /^[1-9][0-9]{7,14}$/, message: 'أرقام بس بكود الدولة، من غير + ولا مسافات.' }]}
                    extra={<Hint text="أرقام بس بكود الدولة من غير + ولا مسافات، مثلاً 201144745671" />}
                >
                    <Input prefix={<MobileOutlined />} maxLength={15} dir="ltr" />
                </Form.Item>
            </Section>

            <Section title="حسابات السوشيال ميديا" description="بتظهر بنفس الترتيب في الفوتر وصفحة التواصل وزرار التواصل السريع.">
                <ListEditor
                    name={['settings', 'social.links']}
                    addLabel="إضافة حساب"
                    foldAfter={99}
                    newItem={{ platform: undefined, url: '' }}
                    itemTitle={(value) => PLATFORMS[String(value?.platform ?? '')] ?? 'حساب جديد'}
                >
                    {(field) => (
                        <Row gutter={12}>
                            <Col xs={24} md={8}>
                                <Form.Item name={[field.name, 'platform']} label="المنصة" rules={[{ required: true, message: 'اختار المنصة.' }]}>
                                    <Select options={Object.entries(PLATFORMS).map(([value, label]) => ({ value, label }))} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={16}>
                                <Form.Item name={[field.name, 'url']} label="الرابط" rules={[...required, { type: 'url', message: 'الرابط لازم يبدأ بـ https://.' }]}>
                                    <Input maxLength={255} placeholder="https://" dir="ltr" />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                </ListEditor>
            </Section>

            <Section title="المكان والنبذة" description="النص اللي بيوصف مكان الشركة، والنبذة القصيرة اللي تحت اللوجو في الفوتر.">
                <TextFields
                    fields={{
                        'contact.location_value': 'المكان في صفحة التواصل',
                        'footer.location': 'المكان في الفوتر',
                        'footer.blurb': { label: 'نبذة الفوتر', textarea: true },
                    }}
                />
            </Section>

            <Section title="الشركة">
                <Form.Item
                    name={['settings', 'company.founded']}
                    label="سنة التأسيس"
                    rules={required}
                    extra="منها بيتحسب عدد سنين الخبرة اللي بيظهر في الموقع، ويزيد لوحده كل سنة."
                >
                    <InputNumber min={1990} max={new Date().getFullYear()} style={{ width: 160 }} />
                </Form.Item>
            </Section>
        </SettingsPage>
    );
}
