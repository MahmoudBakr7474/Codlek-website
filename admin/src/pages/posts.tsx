import { ExportOutlined } from '@ant-design/icons';
import { Create, DeleteButton, Edit, EditButton, List, useForm, useTable } from '@refinedev/antd';
import { Button, Card, Col, DatePicker, Form, Input, Row, Space, Switch, Table, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { Bilingual } from '../components/form/Bilingual';
import { dirFor, suffix } from '../components/form/lang';
import { Hint } from '../components/form/Hint';
import { ImageUpload } from '../components/form/ImageUpload';
import { RichText } from '../components/form/RichText';
import { SearchBox, Thumb, ToggleCell, YesNoFilter } from '../components/list';
import { formatDate } from '../lib/format';
import { useSiteInfo } from '../lib/siteInfo';
import { slugify } from '../lib/slug';

type PostRow = {
    id: number;
    slug: string;
    titleAr: string;
    titleEn: string;
    excerptAr: string;
    excerptEn: string;
    bodyAr: string;
    bodyEn: string;
    categoryAr: string | null;
    categoryEn: string | null;
    cover: string | null;
    coverUrl: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    isVisible: boolean;
};

const required = [{ required: true, message: 'الحقل ده مطلوب.' }];

export function PostList() {
    const { tableProps, setFilters } = useTable<PostRow>({ sorters: { initial: [{ field: 'publishedAt', order: 'desc' }] }, syncWithLocation: false });
    const site = useSiteInfo();

    return (
        <List title="المدونة">
            <Space wrap style={{ marginBottom: 16 }}>
                <SearchBox setFilters={setFilters} placeholder="ابحث بالعنوان" />
                <YesNoFilter field="isPublished" label="منشور" setFilters={setFilters} />
            </Space>
            <Table {...tableProps} rowKey="id">
                <Table.Column<PostRow> width={90} render={(_, row) => <Thumb url={row.coverUrl} />} />
                <Table.Column<PostRow>
                    title="العنوان"
                    render={(_, row) => (
                        <>
                            <Typography.Text strong>{row.titleAr}</Typography.Text>
                            {row.categoryAr && (
                                <>
                                    <br />
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {row.categoryAr}
                                    </Typography.Text>
                                </>
                            )}
                        </>
                    )}
                />
                <Table.Column<PostRow> title="تاريخ النشر" dataIndex="publishedAt" sorter render={(value: string) => formatDate(value)} />
                <Table.Column<PostRow> title="منشور" render={(_, row) => <ToggleCell resource="posts" id={row.id} field="isPublished" value={row.isPublished} />} />
                <Table.Column<PostRow>
                    render={(_, row) => (
                        <Space>
                            {site && row.isVisible && <Button size="small" icon={<ExportOutlined />} href={`${site.siteUrl}/blog/${row.slug}`} target="_blank" aria-label="عرض" />}
                            <EditButton hideText size="small" recordItemId={row.id} />
                            <DeleteButton hideText size="small" recordItemId={row.id} confirmTitle="تمسح المقال ده؟" confirmOkText="امسح" confirmCancelText="إلغاء" />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
}

function PostForm({ editing }: { editing: boolean }) {
    const form = Form.useFormInstance();

    return (
        <Row gutter={24}>
            <Col xs={24} lg={16}>
                <Card title="المقال">
                    <Bilingual>
                        {(lang) => (
                            <>
                                <Form.Item name={lang === 'ar' ? 'titleAr' : 'titleEn'} label={`العنوان${suffix(lang)}`} rules={required}>
                                    <Input
                                        maxLength={200}
                                        dir={dirFor(lang)}
                                        onBlur={(event) => {
                                            // The English title suggests the URL of a new post.
                                            if (lang === 'en' && !editing && !form.getFieldValue('slug')) {
                                                form.setFieldValue('slug', slugify(event.target.value).slice(0, 120));
                                            }
                                        }}
                                    />
                                </Form.Item>
                                <Form.Item name={lang === 'ar' ? 'categoryAr' : 'categoryEn'} label={`التصنيف${suffix(lang)}`}>
                                    <Input maxLength={60} dir={dirFor(lang)} />
                                </Form.Item>
                                <Form.Item name={lang === 'ar' ? 'excerptAr' : 'excerptEn'} label={`ملخص يظهر في القائمة ونتائج البحث${suffix(lang)}`} rules={required}>
                                    <Input.TextArea maxLength={300} autoSize={{ minRows: 2 }} dir={dirFor(lang)} />
                                </Form.Item>
                                <Form.Item name={lang === 'ar' ? 'bodyAr' : 'bodyEn'} label={`المحتوى${suffix(lang)}`} rules={required}>
                                    <RichText dir={dirFor(lang)} />
                                </Form.Item>
                            </>
                        )}
                    </Bilingual>
                </Card>
            </Col>
            <Col xs={24} lg={8}>
                <Card title="النشر">
                    <Form.Item name="slug" label="رابط المقال (slug)" rules={required} extra={<Hint text="حروف إنجليزية وأرقام وشرطات، مثلاً: ecommerce-seo-tips" />}>
                        <Input maxLength={120} dir="ltr" />
                    </Form.Item>
                    <Form.Item name="cover" label="صورة الغلاف" extra="اختيارية. من غيرها بيظهر غلاف بألوان الهوية. الصورة بتتصغّر تلقائياً وتتحفظ WebP.">
                        <ImageUpload preset="posts" aspect="16 / 9" />
                    </Form.Item>
                    <Form.Item name="isPublished" label="منشور" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item
                        name="publishedAt"
                        label="تاريخ النشر"
                        rules={required}
                        extra="تاريخ في المستقبل = يتنشر لوحده في ميعاده."
                        getValueProps={(value: string | null) => ({ value: value ? dayjs(value) : null })}
                        normalize={(value: Dayjs | null) => (value ? value.toISOString() : null)}
                    >
                        <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                </Card>
            </Col>
        </Row>
    );
}

export function PostCreate() {
    const { formProps, saveButtonProps } = useForm<PostRow>({ redirect: 'list' });
    return (
        <Create title="مقال جديد" saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical" initialValues={{ isPublished: true, publishedAt: new Date().toISOString() }}>
                <PostForm editing={false} />
            </Form>
        </Create>
    );
}

export function PostEdit() {
    const { formProps, saveButtonProps } = useForm<PostRow>({ redirect: false });
    return (
        <Edit title="تعديل المقال" saveButtonProps={saveButtonProps} deleteButtonProps={{ confirmTitle: 'تمسح المقال ده؟', confirmOkText: 'امسح', confirmCancelText: 'إلغاء' }}>
            <Form {...formProps} layout="vertical">
                <PostForm editing />
            </Form>
        </Edit>
    );
}
