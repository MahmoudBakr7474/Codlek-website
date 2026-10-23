import { Create, DeleteButton, EditButton, Edit, List, useForm, useSelect, useTable } from '@refinedev/antd';
import { Card, Col, Form, Input, Row, Select, Space, Switch, Table, Tag, Typography } from 'antd';
import { Bilingual } from '../components/form/Bilingual';
import { dirFor, suffix } from '../components/form/lang';
import { ImageUpload } from '../components/form/ImageUpload';
import { OrderButtons, SearchBox, Thumb, ToggleCell, YesNoFilter } from '../components/list';

export type ProjectRow = {
    id: number;
    projectCategoryId: number | null;
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    image: string | null;
    imageUrl: string | null;
    url: string | null;
    host: string | null;
    isFeatured: boolean;
    isComingSoon: boolean;
    isPublished: boolean;
    sortOrder: number;
    categoryName: string | null;
};

const required = [{ required: true, message: 'الحقل ده مطلوب.' }];

export function ProjectList() {
    const { tableProps, setFilters, filters, tableQuery } = useTable<ProjectRow>({ pagination: { mode: 'off' }, syncWithLocation: false });
    const { selectProps } = useSelect({ resource: 'project-categories', optionLabel: 'nameAr', optionValue: 'id', pagination: { mode: 'off' } });
    const rows = tableQuery.data?.data ?? [];
    // Reordering a filtered or searched list would renumber only part of it.
    const filtered = filters.some((f) => 'value' in f && f.value !== undefined && f.value !== '');

    return (
        <List title="المشاريع" headerButtons={({ defaultButtons }) => defaultButtons}>
            <Space wrap style={{ marginBottom: 16 }}>
                <SearchBox setFilters={setFilters} placeholder="ابحث باسم المشروع" />
                <Select
                    {...selectProps}
                    allowClear
                    placeholder="التصنيف"
                    style={{ minWidth: 180 }}
                    onChange={(value) => setFilters([{ field: 'projectCategoryId', operator: 'eq', value }], 'merge')}
                />
                <YesNoFilter field="isPublished" label="منشور" setFilters={setFilters} />
                <YesNoFilter field="isFeatured" label="في الرئيسية" setFilters={setFilters} />
            </Space>

            <Table {...tableProps} rowKey="id" pagination={false}>
                <Table.Column<ProjectRow>
                    width={70}
                    title="الترتيب"
                    render={(_, __, index) => (
                        <OrderButtons resource="projects" ids={rows.map((r) => r.id)} index={index} disabled={filtered} onMoved={() => tableQuery.refetch()} />
                    )}
                />
                <Table.Column<ProjectRow> width={90} render={(_, row) => <Thumb url={row.imageUrl} />} />
                <Table.Column<ProjectRow>
                    title="المشروع"
                    render={(_, row) => (
                        <>
                            <Typography.Text strong>{row.titleAr || row.titleEn}</Typography.Text>
                            {row.host && (
                                <>
                                    <br />
                                    <Typography.Text type="secondary" dir="ltr" style={{ fontSize: 12 }}>
                                        {row.host}
                                    </Typography.Text>
                                </>
                            )}
                        </>
                    )}
                />
                <Table.Column<ProjectRow> title="التصنيف" render={(_, row) => row.categoryName && <Tag>{row.categoryName}</Tag>} />
                <Table.Column<ProjectRow> title="في الرئيسية" render={(_, row) => <ToggleCell resource="projects" id={row.id} field="isFeatured" value={row.isFeatured} />} />
                <Table.Column<ProjectRow> title="منشور" render={(_, row) => <ToggleCell resource="projects" id={row.id} field="isPublished" value={row.isPublished} />} />
                <Table.Column<ProjectRow>
                    render={(_, row) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={row.id} />
                            <DeleteButton hideText size="small" recordItemId={row.id} confirmTitle="تمسح المشروع ده؟" confirmOkText="امسح" confirmCancelText="إلغاء" />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
}

function ProjectForm() {
    const { selectProps } = useSelect({ resource: 'project-categories', optionLabel: 'nameAr', optionValue: 'id', pagination: { mode: 'off' } });

    return (
        <Row gutter={24}>
            <Col xs={24} lg={16}>
                <Card title="بيانات المشروع">
                    <Bilingual>
                        {(lang) => (
                            <>
                                <Form.Item name={lang === 'ar' ? 'titleAr' : 'titleEn'} label={`اسم المشروع${suffix(lang)}`} rules={required}>
                                    <Input maxLength={150} dir={dirFor(lang)} />
                                </Form.Item>
                                <Form.Item name={lang === 'ar' ? 'descriptionAr' : 'descriptionEn'} label={`وصف مختصر${suffix(lang)}`} rules={required}>
                                    <Input.TextArea maxLength={500} autoSize={{ minRows: 3 }} dir={dirFor(lang)} />
                                </Form.Item>
                            </>
                        )}
                    </Bilingual>
                    <Form.Item name="projectCategoryId" label="التصنيف" rules={[{ required: true, message: 'اختار التصنيف.' }]}>
                        <Select {...selectProps} />
                    </Form.Item>
                    <Form.Item name="url" label="رابط الموقع" rules={[{ type: 'url', message: 'الرابط لازم يبدأ بـ https:// ويكون رابط صحيح.' }]}>
                        <Input maxLength={255} placeholder="https://" dir="ltr" />
                    </Form.Item>
                </Card>
            </Col>
            <Col xs={24} lg={8}>
                <Card title="الصورة والنشر">
                    <Form.Item
                        name="image"
                        label="صورة المشروع"
                        extra="لقطة شاشة من الموقع (JPG أو PNG أو WebP). بتتصغّر تلقائياً لعرض 1600 بكسل، ولو كانت لقطة صفحة كاملة بيتحفظ الجزء اللي فوق بس."
                    >
                        <ImageUpload preset="projects" />
                    </Form.Item>
                    <Form.Item name="isPublished" label="منشور على الموقع" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item name="isFeatured" label="يظهر في الصفحة الرئيسية" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item name="isComingSoon" label="قريباً (بدون رابط)" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Card>
            </Col>
        </Row>
    );
}

export function ProjectCreate() {
    const { formProps, saveButtonProps } = useForm<ProjectRow>({ redirect: 'list' });
    return (
        <Create title="مشروع جديد" saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical" initialValues={{ isPublished: true, isFeatured: false, isComingSoon: false }}>
                <ProjectForm />
            </Form>
        </Create>
    );
}

export function ProjectEdit() {
    const { formProps, saveButtonProps } = useForm<ProjectRow>({ redirect: false });
    return (
        <Edit title="تعديل المشروع" saveButtonProps={saveButtonProps} deleteButtonProps={{ confirmTitle: 'تمسح المشروع ده؟', confirmOkText: 'امسح', confirmCancelText: 'إلغاء' }}>
            <Form {...formProps} layout="vertical">
                <ProjectForm />
            </Form>
        </Edit>
    );
}
