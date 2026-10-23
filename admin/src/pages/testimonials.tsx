import { Create, DeleteButton, Edit, EditButton, List, useForm, useTable } from '@refinedev/antd';
import { Card, Col, Form, Input, Row, Select, Space, Switch, Table, Typography } from 'antd';
import { Bilingual } from '../components/form/Bilingual';
import { dirFor, suffix } from '../components/form/lang';
import { ImageUpload } from '../components/form/ImageUpload';
import { OrderButtons, SearchBox, Thumb, ToggleCell, YesNoFilter } from '../components/list';

type TestimonialRow = {
    id: number;
    nameAr: string;
    nameEn: string;
    roleAr: string | null;
    roleEn: string | null;
    quoteAr: string;
    quoteEn: string;
    rating: number;
    avatar: string | null;
    avatarUrl: string | null;
    isPublished: boolean;
    sortOrder: number;
};

const required = [{ required: true, message: 'الحقل ده مطلوب.' }];

const stars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

const ratingOptions = [5, 4, 3, 2, 1].map((rating) => ({ value: rating, label: `${stars(rating)}  (${rating} من 5)` }));

export function TestimonialList() {
    const { tableProps, setFilters, filters, tableQuery } = useTable<TestimonialRow>({ pagination: { mode: 'off' }, syncWithLocation: false });
    const rows = tableQuery.data?.data ?? [];
    const filtered = filters.some((f) => 'value' in f && f.value !== undefined && f.value !== '');

    return (
        <List title="آراء العملاء">
            <Space wrap style={{ marginBottom: 16 }}>
                <SearchBox setFilters={setFilters} />
                <YesNoFilter field="isPublished" label="منشور" setFilters={setFilters} />
                <Select allowClear placeholder="التقييم" style={{ minWidth: 160 }} options={ratingOptions} onChange={(value) => setFilters([{ field: 'rating', operator: 'eq', value }], 'merge')} />
            </Space>
            <Table
                {...tableProps}
                rowKey="id"
                pagination={false}
                locale={{ emptyText: 'لسه مفيش آراء عملاء. القسم مش بيظهر في الرئيسية لحد ما يبقى فيه رأي منشور.' }}
            >
                <Table.Column<TestimonialRow>
                    width={70}
                    title="الترتيب"
                    render={(_, __, index) => (
                        <OrderButtons resource="testimonials" ids={rows.map((r) => r.id)} index={index} disabled={filtered} onMoved={() => tableQuery.refetch()} />
                    )}
                />
                <Table.Column<TestimonialRow> width={56} render={(_, row) => <Thumb url={row.avatarUrl} round />} />
                <Table.Column<TestimonialRow>
                    title="العميل"
                    render={(_, row) => (
                        <>
                            <Typography.Text strong>{row.nameAr}</Typography.Text>
                            {row.roleAr && (
                                <>
                                    <br />
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {row.roleAr}
                                    </Typography.Text>
                                </>
                            )}
                        </>
                    )}
                />
                <Table.Column<TestimonialRow> title="الرأي" render={(_, row) => <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, maxWidth: 420 }}>{row.quoteAr}</Typography.Paragraph>} />
                <Table.Column<TestimonialRow> title="التقييم" render={(_, row) => <span style={{ color: '#faad14', fontSize: 16 }}>{stars(row.rating)}</span>} />
                <Table.Column<TestimonialRow> title="منشور" render={(_, row) => <ToggleCell resource="testimonials" id={row.id} field="isPublished" value={row.isPublished} />} />
                <Table.Column<TestimonialRow>
                    render={(_, row) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={row.id} />
                            <DeleteButton hideText size="small" recordItemId={row.id} confirmTitle="تمسح الرأي ده؟" confirmOkText="امسح" confirmCancelText="إلغاء" />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
}

function TestimonialForm() {
    return (
        <Row gutter={24}>
            <Col xs={24} lg={16}>
                <Card title="رأي العميل" extra={<Typography.Text type="secondary">بيظهر في قسم «آراء العملاء» في الرئيسية.</Typography.Text>}>
                    <Bilingual>
                        {(lang) => {
                            const field = (base: string) => `${base}${lang === 'ar' ? 'Ar' : 'En'}`;
                            return (
                                <>
                                    <Form.Item name={field('name')} label={`اسم العميل${suffix(lang)}`} rules={required}>
                                        <Input maxLength={100} dir={dirFor(lang)} />
                                    </Form.Item>
                                    <Form.Item name={field('role')} label={`الوظيفة أو الشركة${suffix(lang)}`} extra="اختياري، بيظهر تحت الاسم. مثلاً: صاحب متجر الواحة.">
                                        <Input maxLength={120} dir={dirFor(lang)} />
                                    </Form.Item>
                                    <Form.Item name={field('quote')} label={`رأيه${suffix(lang)}`} rules={required} extra="من غير علامات تنصيص، الموقع بيحطها لوحده.">
                                        <Input.TextArea maxLength={600} autoSize={{ minRows: 4 }} dir={dirFor(lang)} />
                                    </Form.Item>
                                </>
                            );
                        }}
                    </Bilingual>
                </Card>
            </Col>
            <Col xs={24} lg={8}>
                <Card title="التقييم والصورة والنشر">
                    <Form.Item name="rating" label="التقييم" rules={required}>
                        <Select options={ratingOptions} />
                    </Form.Item>
                    <Form.Item name="avatar" label="صورة العميل" extra="اختيارية: صورته أو لوجو شركته، في دايرة صغيرة. من غيرها بيظهر أول حرف من اسمه.">
                        <ImageUpload preset="testimonials" round />
                    </Form.Item>
                    <Form.Item name="isPublished" label="منشور على الموقع" valuePropName="checked" extra="لو قفلته بيختفي من الرئيسية.">
                        <Switch />
                    </Form.Item>
                </Card>
            </Col>
        </Row>
    );
}

export function TestimonialCreate() {
    const { formProps, saveButtonProps } = useForm<TestimonialRow>({ redirect: 'list' });
    return (
        <Create title="رأي عميل جديد" saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical" initialValues={{ rating: 5, isPublished: true }}>
                <TestimonialForm />
            </Form>
        </Create>
    );
}

export function TestimonialEdit() {
    const { formProps, saveButtonProps } = useForm<TestimonialRow>({ redirect: false });
    return (
        <Edit title="تعديل رأي العميل" saveButtonProps={saveButtonProps} deleteButtonProps={{ confirmTitle: 'تمسح الرأي ده؟', confirmOkText: 'امسح', confirmCancelText: 'إلغاء' }}>
            <Form {...formProps} layout="vertical">
                <TestimonialForm />
            </Form>
        </Edit>
    );
}
