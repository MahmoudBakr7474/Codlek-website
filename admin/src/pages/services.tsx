import { StarFilled } from '@ant-design/icons';
import { Create, DeleteButton, Edit, EditButton, List, useForm, useTable } from '@refinedev/antd';
import { Button, Card, Col, Form, Input, Radio, Row, Space, Switch, Table, Tag, Typography } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import { Bilingual } from '../components/form/Bilingual';
import { dirFor, suffix } from '../components/form/lang';
import { Hint } from '../components/form/Hint';
import { IconPicker, LucideIcon } from '../components/form/IconPicker';
import { ImageUpload } from '../components/form/ImageUpload';
import { ListEditor } from '../components/form/ListEditor';
import { OrderButtons, SearchBox, Thumb, ToggleCell, YesNoFilter } from '../components/list';
import { useSiteInfo } from '../lib/siteInfo';
import { slugify } from '../lib/slug';

type ServiceRow = {
    id: number;
    key: string;
    icon: string;
    tone: string;
    image: string | null;
    imageUrl: string | null;
    titleAr: string;
    titleEn: string;
    summaryAr: string;
    summaryEn: string;
    descriptionAr: string;
    descriptionEn: string;
    features: Array<{ ar: string; en: string }>;
    isPopular: boolean;
    isPublished: boolean;
    sortOrder: number;
};

/** The icon tile colours of the site (soft background, ink), by tone. */
const tones: Record<string, { label: string; bg: string; ink: string }> = {
    blue: { label: 'أزرق', bg: '#EAF2FF', ink: '#0B63CE' },
    teal: { label: 'تركواز', bg: '#D5F3F1', ink: '#0B7F80' },
    magenta: { label: 'فوشيا', bg: '#FDE2EC', ink: '#B8215A' },
    amber: { label: 'ذهبي', bg: '#FFF1D6', ink: '#9A5B00' },
};

function Tile({ icon, tone, size = 36 }: { icon: string; tone: string; size?: number }) {
    const t = tones[tone] ?? tones.blue;
    return (
        <span style={{ display: 'inline-grid', placeItems: 'center', width: size, height: size, borderRadius: size * 0.27, background: t.bg, color: t.ink }}>
            <LucideIcon name={icon} size={size * 0.5} />
        </span>
    );
}

const required = [{ required: true, message: 'الحقل ده مطلوب.' }];

export function ServiceList() {
    const { tableProps, setFilters, filters, tableQuery } = useTable<ServiceRow>({ pagination: { mode: 'off' }, syncWithLocation: false });
    const site = useSiteInfo();
    const rows = tableQuery.data?.data ?? [];
    const filtered = filters.some((f) => 'value' in f && f.value !== undefined && f.value !== '');

    return (
        <List title="الخدمات">
            <Space wrap style={{ marginBottom: 16 }}>
                <SearchBox setFilters={setFilters} />
                <YesNoFilter field="isPublished" label="منشورة" setFilters={setFilters} />
                <YesNoFilter field="isPopular" label="الأكثر طلباً" setFilters={setFilters} />
            </Space>
            <Table {...tableProps} rowKey="id" pagination={false} locale={{ emptyText: 'لسه مفيش خدمات. ضيف أول خدمة وهتظهر في الرئيسية وصفحة الخدمات والفوتر وفورم التواصل.' }}>
                <Table.Column<ServiceRow>
                    width={70}
                    title="الترتيب"
                    render={(_, __, index) => (
                        <OrderButtons resource="services" ids={rows.map((r) => r.id)} index={index} disabled={filtered} onMoved={() => tableQuery.refetch()} />
                    )}
                />
                <Table.Column<ServiceRow> width={80} render={(_, row) => <Thumb url={row.imageUrl} width={66} />} />
                <Table.Column<ServiceRow> width={60} title="الأيقونة" render={(_, row) => <Tile icon={row.icon} tone={row.tone} />} />
                <Table.Column<ServiceRow>
                    title="الخدمة"
                    render={(_, row) => (
                        <>
                            <Typography.Text strong>{row.titleAr}</Typography.Text>
                            <br />
                            <Typography.Text type="secondary" dir="ltr" style={{ fontSize: 12 }}>
                                #{row.key}
                            </Typography.Text>
                        </>
                    )}
                />
                <Table.Column<ServiceRow> title="المميزات" render={(_, row) => <Tag>{row.features.length}</Tag>} />
                <Table.Column<ServiceRow> title="الأكثر طلباً" render={(_, row) => row.isPopular && <StarFilled style={{ color: '#faad14' }} />} />
                <Table.Column<ServiceRow> title="منشورة" render={(_, row) => <ToggleCell resource="services" id={row.id} field="isPublished" value={row.isPublished} />} />
                <Table.Column<ServiceRow>
                    render={(_, row) => (
                        <Space>
                            {site && row.isPublished && <Button size="small" icon={<ExportOutlined />} href={`${site.siteUrl}/services#${row.key}`} target="_blank" aria-label="عرض" />}
                            <EditButton hideText size="small" recordItemId={row.id} />
                            <DeleteButton hideText size="small" recordItemId={row.id} confirmTitle="تمسح الخدمة دي؟" confirmOkText="امسح" confirmCancelText="إلغاء" />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
}

function ServiceForm({ editing }: { editing: boolean }) {
    const form = Form.useFormInstance();
    const icon = Form.useWatch('icon', form) as string | undefined;

    return (
        <Row gutter={24}>
            <Col xs={24} lg={16}>
                <Space direction="vertical" size={24} style={{ width: '100%' }}>
                    <Card title="الخدمة" extra={<Typography.Text type="secondary">الاسم والوصف زي ما بيظهروا في الرئيسية وصفحة الخدمات.</Typography.Text>}>
                        <Bilingual>
                            {(lang) => (
                                <>
                                    <Form.Item name={lang === 'ar' ? 'titleAr' : 'titleEn'} label={`اسم الخدمة${suffix(lang)}`} rules={required}>
                                        <Input
                                            maxLength={80}
                                            dir={dirFor(lang)}
                                            onBlur={(event) => {
                                                // The English name suggests the key of a new service.
                                                if (lang === 'en' && !editing && !form.getFieldValue('key')) {
                                                    form.setFieldValue('key', slugify(event.target.value).slice(0, 60));
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name={lang === 'ar' ? 'summaryAr' : 'summaryEn'}
                                        label={`وصف قصير${suffix(lang)}`}
                                        rules={required}
                                        extra="سطر أو اتنين، بيظهروا في كارت الخدمة في الصفحة الرئيسية."
                                    >
                                        <Input.TextArea maxLength={300} autoSize={{ minRows: 2 }} dir={dirFor(lang)} />
                                    </Form.Item>
                                    <Form.Item
                                        name={lang === 'ar' ? 'descriptionAr' : 'descriptionEn'}
                                        label={`الوصف الكامل${suffix(lang)}`}
                                        rules={required}
                                        extra="بيظهر في صفحة الخدمات جنب صورة الخدمة."
                                    >
                                        <Input.TextArea maxLength={1500} autoSize={{ minRows: 4 }} dir={dirFor(lang)} />
                                    </Form.Item>
                                </>
                            )}
                        </Bilingual>
                    </Card>

                    <Card title="المميزات" extra={<Typography.Text type="secondary">نقط قصيرة بعلامة ✓ تحت وصف الخدمة.</Typography.Text>}>
                        <ListEditor name={['features']} addLabel="إضافة ميزة" max={12} foldAfter={99} newItem={{ ar: '', en: '' }} itemTitle={(value, i) => (value?.ar as string) || `ميزة ${i + 1}`}>
                            {(field) => (
                                <Row gutter={12}>
                                    <Col xs={24} md={12}>
                                        <Form.Item name={[field.name, 'ar']} label="الميزة بالعربي" rules={required}>
                                            <Input maxLength={80} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item name={[field.name, 'en']} label="English" rules={required}>
                                            <Input maxLength={80} dir="ltr" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}
                        </ListEditor>
                    </Card>
                </Space>
            </Col>

            <Col xs={24} lg={8}>
                <Card title="الرابط والشكل والنشر">
                    <Form.Item
                        name="key"
                        label="رابط الخدمة (key)"
                        rules={required}
                        normalize={(value: string) => value?.toLowerCase().trim()}
                        extra={
                            <Hint text="حروف إنجليزية صغيرة وأرقام وشرطات، زي web. بيتستخدم في روابط زي /services#web وفي اختيار الخدمة في فورم التواصل، فمتغيّروش بعد ما الموقع يشتغل." />
                        }
                        tooltip={editing ? 'تغييره بيكسر الروابط القديمة' : undefined}
                    >
                        <Input maxLength={60} dir="ltr" />
                    </Form.Item>
                    <Form.Item name="icon" label="الأيقونة" rules={required} extra="ابحث بالإنجليزي، مثلاً: rocket أو star أو users.">
                        <IconPicker />
                    </Form.Item>
                    <Form.Item name="tone" label="لون الأيقونة" rules={required} extra="لون المربع اللي ورا الأيقونة في كارت الخدمة. نوّع الألوان بين الخدمات اللي جنب بعض.">
                        <Radio.Group>
                            <Space wrap>
                                {Object.entries(tones).map(([tone, t]) => (
                                    <Radio.Button key={tone} value={tone} style={{ height: 'auto', paddingBlock: 6 }}>
                                        <Space size={8}>
                                            <Tile icon={icon ?? 'layout-grid'} tone={tone} size={28} />
                                            {t.label}
                                        </Space>
                                    </Radio.Button>
                                ))}
                            </Space>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item
                        name="image"
                        label="صورة الخدمة"
                        extra="اختيارية. بتظهر فوق كارت الخدمة في الرئيسية وجنبها في صفحة الخدمات، بنسبة 3:2 (أحسن مقاس 1200×800). من غيرها بتظهر الأيقونة."
                    >
                        <ImageUpload preset="services" aspect="3 / 2" />
                    </Form.Item>
                    <Form.Item name="isPopular" label="عليها شارة الأكثر طلباً" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item
                        name="isPublished"
                        label="منشورة على الموقع"
                        valuePropName="checked"
                        extra="لو قفلتها بتختفي من الرئيسية وصفحة الخدمات والفوتر واختيارات فورم التواصل."
                    >
                        <Switch />
                    </Form.Item>
                </Card>
            </Col>
        </Row>
    );
}

export function ServiceCreate() {
    const { formProps, saveButtonProps } = useForm<ServiceRow>({ redirect: 'list' });
    return (
        <Create title="خدمة جديدة" saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical" initialValues={{ icon: 'layout-grid', tone: 'blue', isPublished: true, isPopular: false, features: [] }}>
                <ServiceForm editing={false} />
            </Form>
        </Create>
    );
}

export function ServiceEdit() {
    const { formProps, saveButtonProps } = useForm<ServiceRow>({ redirect: false });
    return (
        <Edit title="تعديل الخدمة" saveButtonProps={saveButtonProps} deleteButtonProps={{ confirmTitle: 'تمسح الخدمة دي؟', confirmOkText: 'امسح', confirmCancelText: 'إلغاء' }}>
            <Form {...formProps} layout="vertical">
                <ServiceForm editing />
            </Form>
        </Edit>
    );
}
