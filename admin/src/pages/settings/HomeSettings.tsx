import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Collapse, ColorPicker, Form, Input, Radio, Row, Select, Space, Switch, Typography } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { useEffect, useState } from 'react';
import { FormTabs } from '../../components/form/FormTabs';
import { Hint } from '../../components/form/Hint';
import { IconPicker } from '../../components/form/IconPicker';
import { ImageUpload } from '../../components/form/ImageUpload';
import { ListEditor } from '../../components/form/ListEditor';
import { pairLabel } from '../../components/form/lang';
import { Pair } from '../../components/form/Pair';
import { Section } from '../../components/form/Section';
import { SettingsPage } from '../../components/settings/SettingsPage';
import { TextFields, type TextSpec } from '../../components/settings/TextFields';
import { api } from '../../lib/http';
import { useSiteInfo } from '../../lib/siteInfo';

/** The home sections by their Arabic name. */
const SECTION_NAMES: Record<string, string> = {
    services: 'الخدمات',
    projects: 'المشاريع المميزة',
    why: 'لماذا كودلك',
    technologies: 'التقنيات',
    industries: 'القطاعات',
    journey: 'رحلة المشروع',
    team: 'الفريق',
    testimonials: 'آراء العملاء',
    cta: 'شريط الدعوة للتواصل',
};

const HERO_TEXTS: Record<string, TextSpec> = {
    'home.hero.badge': { label: 'الشارة فوق العنوان', hint: 'سطر قصير بأيقونة، بيوصف الشركة في كلمتين.' },
    'home.hero.title_1': 'العنوان: السطر الأول',
    'home.hero.title_2': { label: 'العنوان: السطر التاني (الملوّن)', hint: 'بيظهر في سطر لوحده تحت السطر الأول، بلون تركواز عشان يلفت النظر.' },
    'home.hero.lead': { label: 'الوصف تحت العنوان', textarea: true },
};

const TRUST_TEXTS: Record<string, TextSpec> = {
    'home.hero.trust_title': 'السطر الأول (العريض)',
    'home.hero.trust_text': 'السطر التاني',
};

const eyebrow: TextSpec = 'الكلمة الصغيرة فوق العنوان';
const title: TextSpec = 'العنوان';
const lead: TextSpec = { label: 'الوصف تحت العنوان', textarea: true };

/** The headings of every section below the hero, by section. */
const HEADINGS: Array<{ key: string; description: string; fields: Record<string, TextSpec> }> = [
    {
        key: 'services',
        description: 'الخدمات نفسها بتتعدّل من صفحة «الخدمات» في القائمة.',
        fields: {
            'home.services.eyebrow': eyebrow,
            'home.services.title': title,
            'home.services.lead': lead,
            'home.services.popular': { label: 'شارة الخدمة المميزة', hint: 'بتظهر على الخدمة اللي عليها «الأكثر طلباً».' },
            'home.services.request': { label: 'الرابط في آخر كل كارت', hint: 'بيفتح فورم التواصل والخدمة متختارة فيه.' },
        },
    },
    {
        key: 'projects',
        description: 'بيعرض لحد 4 مشاريع منشورة عليها «يظهر في الصفحة الرئيسية» من صفحة «المشاريع».',
        fields: { 'home.projects.eyebrow': eyebrow, 'home.projects.title': title, 'home.projects.lead': lead },
    },
    {
        key: 'why',
        description: 'العناوين ومربع سنين الخبرة. الأرقام والمميزات في تبويب «لماذا كودلك».',
        fields: {
            'home.why.eyebrow': eyebrow,
            'home.why.title_1': 'العنوان: السطر الأول',
            'home.why.title_2': 'العنوان: السطر التاني (الملوّن)',
            'home.why.lead': lead,
            'home.why.years_title': { label: 'عنوان مربع سنين الخبرة', hint: 'بيظهر تحت رقم سنين الخبرة اللي بيتحسب لوحده.' },
            'home.why.years_text': 'السطر تحت عنوان سنين الخبرة',
        },
    },
    { key: 'technologies', description: 'أسامي الأدوات وألوانها في تبويب «التقنيات».', fields: { 'home.tech.title': title, 'home.tech.lead': lead } },
    { key: 'industries', description: 'الكروت نفسها في تبويب «القطاعات».', fields: { 'home.industries.eyebrow': eyebrow, 'home.industries.title': title, 'home.industries.lead': lead } },
    {
        key: 'journey',
        description: 'الخطوات نفسها في تبويب «رحلة المشروع». لو غيّرت عدد الخطوات غيّر الرقم في العنوان.',
        fields: { 'home.journey.eyebrow': eyebrow, 'home.journey.title': title, 'home.journey.lead': lead },
    },
    { key: 'team', description: 'التخصصات نفسها في تبويب «الفريق».', fields: { 'home.team.eyebrow': eyebrow, 'home.team.title': title, 'home.team.lead': lead } },
    { key: 'testimonials', description: 'الآراء نفسها بتتعدّل من صفحة «آراء العملاء» في القائمة.', fields: { 'home.testimonials.eyebrow': eyebrow, 'home.testimonials.title': title } },
    {
        key: 'cta',
        description: 'الشريط الأزرق اللي فيه زرار «استشارة مجانية» و«اطلب عرض سعر»، وبيظهر كمان في صفحات تانية في الموقع.',
        fields: { 'cta_band.title': title, 'cta_band.lead': lead },
    },
];

const SETTING_KEYS = [
    'home.hero_stats',
    'home.hero_visual',
    'home.hero_image',
    'home.hero_main_project',
    'home.hero_second_project',
    'home.hero_trust_visible',
    'home.sections',
    'home.why',
    'home.technologies',
    'home.industries',
    'home.journey',
    'home.team',
];

const TEXT_KEYS = [...Object.keys(HERO_TEXTS), ...Object.keys(TRUST_TEXTS), ...HEADINGS.flatMap((group) => Object.keys(group.fields))];

const required = [{ required: true, message: 'الحقل ده مطلوب.' }];

type HeroProject = { id: number; label: string; imageUrl: string };

/** "تقييم العملاء · 4.9/5": the number kept left-to-right inside the Arabic. */
function statTitle(value: Record<string, unknown> | undefined) {
    const label = pairLabel(value?.label);
    const number = String(value?.value ?? '').trim();
    if (!label && !number) return 'رقم جديد';
    return (
        <>
            {label}
            {label && number && ' · '}
            {number && <bdi dir="ltr">{number}</bdi>}
        </>
    );
}

function StatsEditor({ name, max, placeholder }: { name: (string | number)[]; max: number; placeholder: string }) {
    return (
        <ListEditor name={name} addLabel="إضافة رقم" max={max} newItem={{ value: '', label: { ar: '', en: '' } }} itemTitle={(value) => statTitle(value)}>
            {(field) => (
                <Row gutter={12}>
                    <Col xs={24} md={6}>
                        <Form.Item name={[field.name, 'value']} label="الرقم" rules={required}>
                            <Input maxLength={20} placeholder={placeholder} dir="ltr" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={18}>
                        <Pair name={[field.name, 'label']} label="الوصف تحت الرقم" max={60} />
                    </Col>
                </Row>
            )}
        </ListEditor>
    );
}

function CardsEditor({ name, addLabel, newLabel, max }: { name: string; addLabel: string; newLabel: string; max: number }) {
    return (
        <ListEditor
            name={['settings', name]}
            addLabel={addLabel}
            max={max}
            foldAfter={3}
            newItem={{ icon: 'circle', title: { ar: '', en: '' }, text: { ar: '', en: '' } }}
            itemTitle={(value) => pairLabel(value?.title) || newLabel}
        >
            {(field) => (
                <>
                    <Row gutter={12}>
                        <Col xs={24} md={12}>
                            <Form.Item name={[field.name, 'icon']} label="الأيقونة" rules={required}>
                                <IconPicker />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Pair name={[field.name, 'title']} label="العنوان" max={80} />
                    <Pair name={[field.name, 'text']} label="الوصف القصير" max={160} />
                </>
            )}
        </ListEditor>
    );
}

function SectionsOrder() {
    return (
        <Form.List name={['settings', 'home.sections']}>
            {(fields, { move }) => (
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    {fields.map((field, index) => (
                        <Card size="small" key={field.key}>
                            <Form.Item noStyle shouldUpdate>
                                {(form) => {
                                    const item = form.getFieldValue(['settings', 'home.sections', field.name]) as { key: string; visible: boolean };
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                            <Typography.Text strong type={item?.visible ? undefined : 'secondary'}>
                                                {SECTION_NAMES[item?.key] ?? 'قسم'}
                                                {item?.visible === false && ' (مخفي)'}
                                            </Typography.Text>
                                            <Space>
                                                <Form.Item name={[field.name, 'visible']} valuePropName="checked" noStyle>
                                                    <Switch checkedChildren="يظهر" unCheckedChildren="مخفي" />
                                                </Form.Item>
                                                <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => move(index, index - 1)} aria-label="لفوق" />
                                                <Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={index === fields.length - 1} onClick={() => move(index, index + 1)} aria-label="لتحت" />
                                            </Space>
                                        </div>
                                    );
                                }}
                            </Form.Item>
                        </Card>
                    ))}
                </Space>
            )}
        </Form.List>
    );
}

function ProjectPicker({ name, label, projects }: { name: string; label: string; projects: HeroProject[] }) {
    const form = Form.useFormInstance();
    const value = Form.useWatch(['settings', name], form) as number | null | undefined;
    const chosen = projects.find((p) => p.id === value);

    return (
        <>
            <Form.Item name={['settings', name]} label={label}>
                <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    placeholder="تلقائي (مشروع مميز)"
                    notFoundContent="مفيش مشروع منشور بالاسم ده وليه صورة."
                    options={projects.map((p) => ({ value: p.id, label: p.label }))}
                />
            </Form.Item>
            {chosen && <img src={chosen.imageUrl} alt="" style={{ width: '100%', maxWidth: 280, aspectRatio: '16 / 10', objectFit: 'cover', objectPosition: 'top', borderRadius: 8, border: '1px solid rgb(127 127 127 / .3)', marginTop: -8, marginBottom: 16 }} />}
        </>
    );
}

function HeroVisual() {
    const form = Form.useFormInstance();
    const site = useSiteInfo();
    const visual = Form.useWatch(['settings', 'home.hero_visual'], form) as string | undefined;
    const [projects, setProjects] = useState<HeroProject[]>([]);

    useEffect(() => {
        api<HeroProject[]>('/options/hero-projects').then(setProjects);
    }, []);

    return (
        <>
            <Form.Item name={['settings', 'home.hero_visual']} label="تعرض إيه؟" rules={required}>
                <Radio.Group>
                    <Space direction="vertical">
                        <Radio value="image">
                            <b>رسم توضيحي / صورة</b>
                            <br />
                            <Typography.Text type="secondary">الرسم التوضيحي الأصلي (موقع على كمبيوتر وموبايل)، أو صورة ترفعها انت بداله.</Typography.Text>
                        </Radio>
                        <Radio value="projects">
                            <b>لقطات من مشاريعنا</b>
                            <br />
                            <Typography.Text type="secondary">سكرين شوت لمشروع كبير في إطار متصفح، ومشروع تاني أصغر فوق طرفه على الشاشات الكبيرة.</Typography.Text>
                        </Radio>
                    </Space>
                </Radio.Group>
            </Form.Item>

            {/* Both stay in the form: the choice hidden here is kept for later. */}
            <div style={{ display: visual === 'projects' ? 'none' : undefined }}>
                <Form.Item
                    name={['settings', 'home.hero_image']}
                    label="صورة من عندك (اختيارية)"
                    extra={<Hint text="من غيرها بيظهر الرسم التوضيحي الأصلي (المعروض هنا). أحسن مقاس 1200×800 بنسبة 3:2. بتتصغّر تلقائياً وتتحفظ WebP." />}
                >
                    <ImageUpload preset="hero" aspect="3 / 2" fallback={site ? `${site.siteUrl}/images/hero/hero-illustration.webp` : undefined} />
                </Form.Item>
            </div>

            <div style={{ display: visual === 'projects' ? undefined : 'none' }}>
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <ProjectPicker name="home.hero_main_project" label="الصورة الكبيرة" projects={projects} />
                    </Col>
                    <Col xs={24} md={12}>
                        <ProjectPicker name="home.hero_second_project" label="الصورة الصغيرة" projects={projects} />
                    </Col>
                </Row>
                <Typography.Paragraph type="secondary">
                    لو سبت الاختيار «تلقائي»، الموقع بيعرض المشاريع المميزة (اللي عليها «يظهر في الصفحة الرئيسية») بالترتيب. المشروع لازم يكون منشور وليه صورة عشان يظهر في القائمة دي.
                    ولو مفيش ولا مشروع ينفع، الهيرو بيرجع للرسم التوضيحي.
                </Typography.Paragraph>
            </div>
        </>
    );
}

function TechnologiesEditor() {
    return (
        <ListEditor
            name={['settings', 'home.technologies']}
            addLabel="إضافة تقنية"
            max={32}
            foldAfter={8}
            newItem={{ name: '', color: '#0B63CE' }}
            itemTitle={(value) => (
                <Space size={8}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: String(value?.color ?? '#0B63CE'), display: 'inline-block', boxShadow: '0 0 0 1px rgb(127 127 127 / .35)' }} />
                    {value?.name ? <bdi dir="ltr">{String(value.name)}</bdi> : 'تقنية جديدة'}
                </Space>
            )}
        >
            {(field) => (
                <Row gutter={12}>
                    <Col xs={24} md={14}>
                        <Form.Item name={[field.name, 'name']} label="الاسم" rules={required}>
                            <Input maxLength={40} placeholder="Laravel" dir="ltr" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={10}>
                        <Form.Item
                            name={[field.name, 'color']}
                            label="لون النقطة"
                            rules={required}
                            getValueFromEvent={(color: Color) => color.toHexString().toUpperCase()}
                            extra={<Hint text="اختار من المربع أو الصق كود اللون، مثلاً #0B63CE." />}
                        >
                            <ColorPicker showText format="hex" disabledAlpha />
                        </Form.Item>
                    </Col>
                </Row>
            )}
        </ListEditor>
    );
}

export function HomeSettings() {
    return (
        <SettingsPage title="الصفحة الرئيسية" settingKeys={SETTING_KEYS} textKeys={TEXT_KEYS} viewPath="/">
            <FormTabs
                items={[
                    {
                        key: 'hero',
                        label: 'الهيرو',                        children: (
                            <>
                                <Section title="نصوص الهيرو" description="أول حاجة الزائر بيشوفها: الشارة الصغيرة، العنوان الكبير، والوصف اللي تحته.">
                                    <TextFields fields={HERO_TEXTS} />
                                </Section>
                                <Section
                                    title="أرقام الهيرو"
                                    description="لحد 3 أرقام في الشريط اللي تحت الأزرار. لو مسحتهم كلهم الشريط هيختفي. أرقام قسم «لماذا كودلك» في تبويبه، وأحسن تكون غير دي عشان الرقم ما يتكررش."
                                >
                                    <Alert
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                        message={<Hint text="اكتب {years}+ في الرقم عشان يظهر عدد سنين الخبرة، وده بيتحسب من سنة التأسيس ويزيد لوحده كل سنة. ولو كتبت 4.9/5 الجزء اللي بعد العلامة بيظهر أصغر." />}
                                    />
                                    <StatsEditor name={['settings', 'home.hero_stats']} max={3} placeholder="500+" />
                                </Section>
                                <Section title="الصورة جنب العنوان" description="اللي بيظهر جنب نصوص الهيرو: رسم توضيحي أو صورة من عندك، أو لقطات شاشة من مشروعين من شغلكم.">
                                    <HeroVisual />
                                </Section>
                                <Section title="كارت «موثوق»" description="الكارت الأبيض الصغير اللي على طرف الصورة، بعلامة صح وسطرين كلام.">
                                    <Form.Item name={['settings', 'home.hero_trust_visible']} label="يظهر على الصورة" valuePropName="checked" extra="اقفله عشان تخفي الكارت. الكلام بيفضل محفوظ لو حبيت ترجّعه.">
                                        <Switch />
                                    </Form.Item>
                                    <TextFields fields={TRUST_TEXTS} />
                                </Section>
                            </>
                        ),
                    },
                    {
                        key: 'sections',
                        label: 'ترتيب الأقسام',                        children: (
                            <Section
                                title="الأقسام تحت الهيرو"
                                description="رتّب الأقسام بالأسهم، واقفل اللي مش عايزه يظهر. الهيرو دايماً أول حاجة في الصفحة. قسم «المشاريع المميزة» و«آراء العملاء» بيختفوا لوحدهم لو مفيش محتوى منشور ليهم، وكذلك أي قسم قايمته فاضية."
                            >
                                <SectionsOrder />
                            </Section>
                        ),
                    },
                    {
                        key: 'headings',
                        label: 'عناوين الأقسام',                        children: (
                            <Collapse
                                destroyOnHidden={false}
                                items={HEADINGS.map((group) => ({
                                    key: group.key,
                                    label: SECTION_NAMES[group.key],
                                    forceRender: true,
                                    children: (
                                        <>
                                            <Typography.Paragraph type="secondary">{group.description}</Typography.Paragraph>
                                            <TextFields fields={group.fields} />
                                        </>
                                    ),
                                }))}
                            />
                        ),
                    },
                    {
                        key: 'why',
                        label: 'لماذا كودلك',                        children: (
                            <>
                                <Section
                                    title="أرقام القسم"
                                    description="المربعات الصغيرة تحت مربع سنين الخبرة (أحسن شكل 3). رقم سنين الخبرة الكبير بيتحسب لوحده من سنة التأسيس. اختار أرقام غير اللي في شريط الهيرو، عشان كل مربع يضيف معلومة جديدة."
                                >
                                    <StatsEditor name={['settings', 'home.why', 'stats']} max={4} placeholder="98%" />
                                </Section>
                                <Section title="المميزات" description="النقاط اللي تحت العنوان، كل نقطة بأيقونة. اكتب {years} عشان يظهر عدد سنين الخبرة.">
                                    <ListEditor
                                        name={['settings', 'home.why', 'features']}
                                        addLabel="إضافة ميزة"
                                        max={6}
                                        newItem={{ icon: 'circle', text: { ar: '', en: '' } }}
                                        itemTitle={(value) => pairLabel(value?.text) || 'ميزة جديدة'}
                                    >
                                        {(field) => (
                                            <>
                                                <Row>
                                                    <Col xs={24} md={12}>
                                                        <Form.Item name={[field.name, 'icon']} label="الأيقونة" rules={required}>
                                                            <IconPicker />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                                <Pair name={[field.name, 'text']} label="الميزة" max={200} />
                                            </>
                                        )}
                                    </ListEditor>
                                </Section>
                            </>
                        ),
                    },
                    {
                        key: 'technologies',
                        label: 'التقنيات',                        children: (
                            <Section title="الأدوات والتقنيات" description="أسامي الأدوات اللي في قسم التقنيات، كل اسم جنبه نقطة بلون تختاره، وبيتعرضوا بنفس الترتيب ده. لو مسحتها كلها القسم هيختفي.">
                                <TechnologiesEditor />
                            </Section>
                        ),
                    },
                    {
                        key: 'industries',
                        label: 'القطاعات',                        children: (
                            <Section title="القطاعات" description="كروت المجالات اللي بتشتغلوا فيها، 4 في كل صف على الشاشة الكبيرة (أحسن شكل 4 أو 8 أو 12). لو مسحتهم كلهم القسم هيختفي.">
                                <CardsEditor name="home.industries" addLabel="إضافة قطاع" newLabel="قطاع جديد" max={12} />
                            </Section>
                        ),
                    },
                    {
                        key: 'journey',
                        label: 'رحلة المشروع',                        children: (
                            <Section
                                title="رحلة المشروع"
                                description="خطوات الشغل بالترتيب، وكل خطوة بتاخد رقمها لوحدها. لحد 7 خطوات بيظهروا في صف واحد. لو غيّرت عدد الخطوات، غيّر الرقم اللي في عنوان القسم من تبويب «عناوين الأقسام»."
                            >
                                <CardsEditor name="home.journey" addLabel="إضافة خطوة" newLabel="خطوة جديدة" max={7} />
                            </Section>
                        ),
                    },
                    {
                        key: 'team',
                        label: 'الفريق',                        children: (
                            <Section title="الفريق" description="تخصصات الفريق، كارت لكل تخصص. لحد 7 بيظهروا في صف واحد على الشاشة الكبيرة. لو مسحتهم كلهم القسم هيختفي.">
                                <CardsEditor name="home.team" addLabel="إضافة تخصص" newLabel="تخصص جديد" max={12} />
                            </Section>
                        ),
                    },
                ]}
            />
        </SettingsPage>
    );
}
