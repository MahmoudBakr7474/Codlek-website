import { Col, Form, Input, Row } from 'antd';
import { Hint } from '../../components/form/Hint';
import { IconPicker } from '../../components/form/IconPicker';
import { ListEditor } from '../../components/form/ListEditor';
import { pairLabel } from '../../components/form/lang';
import { Pair } from '../../components/form/Pair';
import { Section } from '../../components/form/Section';
import { SettingsPage } from '../../components/settings/SettingsPage';
import { TextFields } from '../../components/settings/TextFields';
import { useSiteInfo } from '../../lib/siteInfo';

const SETTING_KEYS = ['about.stats', 'about.story', 'about.values', 'about.why', 'about.satisfaction'];
const TEXT_KEYS = [
    'about.hero.eyebrow',
    'about.hero.title',
    'about.hero.lead',
    'about.story.eyebrow',
    'about.story.title',
    'about.story.since',
    'about.values.eyebrow',
    'about.values.title',
    'about.why.eyebrow',
    'about.why.title',
    'about.why.satisfaction',
];

const required = [{ required: true, message: 'الحقل ده مطلوب.' }];

export function AboutSettings() {
    const site = useSiteInfo();
    const founded = site?.founded ?? '';

    return (
        <SettingsPage title="صفحة من نحن" settingKeys={SETTING_KEYS} textKeys={TEXT_KEYS} viewPath="/about">
            <Section title="أول الصفحة" description="الكلمة الصغيرة والعنوان والوصف اللي في أول صفحة من نحن.">
                <TextFields
                    fields={{
                        'about.hero.eyebrow': 'الكلمة الصغيرة فوق العنوان',
                        'about.hero.title': { label: 'العنوان', hint: 'وهو كمان اسم الصفحة في تبويب المتصفح وجوجل.' },
                        'about.hero.lead': { label: 'الوصف', textarea: true, hint: `بيظهر كمان كوصف الصفحة في نتايج جوجل. الكلمة :founded بتتبدل بسنة التأسيس (${founded}).` },
                    }}
                />
            </Section>

            <Section title="شريط الأرقام" description="الأرقام اللي في الشريط تحت وصف أول الصفحة، لحد 4 أرقام.">
                <Hint text={`اكتب {years} في الرقم عشان يتحسب عدد سنين الخبرة لوحده من سنة التأسيس (السنة دي: ${site?.yearsOfExperience ?? ''})، مثلاً {years}+.`} />
                <div style={{ marginTop: 12 }}>
                    <ListEditor
                        name={['settings', 'about.stats']}
                        addLabel="إضافة رقم"
                        max={4}
                        newItem={{ value: '', label: { ar: '', en: '' } }}
                        itemTitle={(value) => (value?.value ? <><bdi dir="ltr">{String(value.value)}</bdi> {pairLabel(value.label)}</> : 'رقم جديد')}
                    >
                        {(field) => (
                            <Row gutter={12}>
                                <Col xs={24} md={6}>
                                    <Form.Item name={[field.name, 'value']} label="الرقم" rules={required}>
                                        <Input maxLength={20} placeholder="500+" dir="ltr" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={18}>
                                    <Pair name={[field.name, 'label']} label="الوصف" max={60} />
                                </Col>
                            </Row>
                        )}
                    </ListEditor>
                </div>
            </Section>

            <Section title="قصتنا" description="العنوان والفقرات اللي بتحكي قصة الشركة، وجملة «منذ» اللي تحت اللوجو.">
                <TextFields
                    fields={{
                        'about.story.eyebrow': 'الكلمة الصغيرة فوق العنوان',
                        'about.story.title': 'العنوان',
                        'about.story.since': { label: 'الجملة اللي تحت اللوجو', hint: `اكتب :year مكان السنة، وهتتكتب مكانها سنة التأسيس لوحدها (دلوقتي ${founded}).` },
                    }}
                />
                <ListEditor
                    name={['settings', 'about.story']}
                    addLabel="إضافة فقرة"
                    min={1}
                    foldAfter={2}
                    newItem={{ ar: '', en: '' }}
                    itemTitle={(value) => (pairLabel(value).slice(0, 70) || 'فقرة جديدة')}
                >
                    {(field) => <Pair name={[field.name]} label="الفقرة" textarea rows={4} max={1500} hint="تقدر تكتب {years} وهيتكتب مكانها عدد سنين الخبرة." />}
                </ListEditor>
            </Section>

            <Section title="قيمنا" description="كروت القيم: لكل كارت أيقونة وعنوان وجملة قصيرة. بتظهر 4 جنب بعض على الكمبيوتر و2 على الموبايل.">
                <TextFields fields={{ 'about.values.eyebrow': 'الكلمة الصغيرة فوق العنوان', 'about.values.title': 'العنوان' }} />
                <ListEditor
                    name={['settings', 'about.values']}
                    addLabel="إضافة قيمة"
                    max={8}
                    foldAfter={0}
                    newItem={{ icon: 'circle', title: { ar: '', en: '' }, text: { ar: '', en: '' } }}
                    itemTitle={(value) => pairLabel(value?.title) || 'قيمة جديدة'}
                >
                    {(field) => (
                        <>
                            <Row gutter={12}>
                                <Col xs={24} md={8}>
                                    <Form.Item name={[field.name, 'icon']} label="الأيقونة" rules={required}>
                                        <IconPicker />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={16}>
                                    <Pair name={[field.name, 'title']} label="العنوان" max={60} />
                                </Col>
                            </Row>
                            <Pair name={[field.name, 'text']} label="الجملة" textarea rows={2} max={200} />
                        </>
                    )}
                </ListEditor>
            </Section>

            <Section title="ما يميزنا" description="قائمة المميزات وكارت نسبة رضا العملاء اللي جنبها.">
                <TextFields
                    fields={{
                        'about.why.eyebrow': 'الكلمة الصغيرة فوق العنوان',
                        'about.why.title': 'العنوان',
                        'about.why.satisfaction': 'الكلام اللي تحت النسبة في الكارت',
                    }}
                />
                <Form.Item name={['settings', 'about.satisfaction']} label="نسبة رضا العملاء" rules={required} extra="الرقم الكبير اللي في الكارت، مثلاً 98%." style={{ maxWidth: 220 }}>
                    <Input maxLength={10} placeholder="98%" dir="ltr" />
                </Form.Item>
                <ListEditor
                    name={['settings', 'about.why']}
                    addLabel="إضافة ميزة"
                    max={12}
                    foldAfter={99}
                    newItem={{ ar: '', en: '' }}
                    itemTitle={(value, i) => pairLabel(value) || `ميزة ${i + 1}`}
                >
                    {(field) => <Pair name={[field.name]} label="الميزة" max={150} />}
                </ListEditor>
            </Section>
        </SettingsPage>
    );
}
