import { Create, DeleteButton, Edit, EditButton, List, useForm, useTable } from '@refinedev/antd';
import { Card, Form, Input, Space, Table, Tag } from 'antd';
import { Hint } from '../components/form/Hint';
import { IconPicker, LucideIcon } from '../components/form/IconPicker';
import { OrderButtons, SearchBox } from '../components/list';

type CategoryRow = { id: number; slug: string; nameAr: string; nameEn: string; icon: string; sortOrder: number; projectsCount: number };

const required = [{ required: true, message: 'الحقل ده مطلوب.' }];

export function CategoryList() {
    const { tableProps, setFilters, filters, tableQuery } = useTable<CategoryRow>({ pagination: { mode: 'off' }, syncWithLocation: false });
    const rows = tableQuery.data?.data ?? [];
    const filtered = filters.some((f) => 'value' in f && f.value);

    return (
        <List title="تصنيفات المشاريع">
            <Space style={{ marginBottom: 16 }}>
                <SearchBox setFilters={setFilters} />
            </Space>
            <Table {...tableProps} rowKey="id" pagination={false}>
                <Table.Column<CategoryRow>
                    width={70}
                    title="الترتيب"
                    render={(_, __, index) => (
                        <OrderButtons resource="project-categories" ids={rows.map((r) => r.id)} index={index} disabled={filtered} onMoved={() => tableQuery.refetch()} />
                    )}
                />
                <Table.Column<CategoryRow> width={50} render={(_, row) => <LucideIcon name={row.icon} size={20} />} />
                <Table.Column<CategoryRow> title="الاسم" dataIndex="nameAr" />
                <Table.Column<CategoryRow> title="English" dataIndex="nameEn" />
                <Table.Column<CategoryRow> title="الرابط" render={(_, row) => <Tag dir="ltr">{row.slug}</Tag>} />
                <Table.Column<CategoryRow> title="عدد المشاريع" dataIndex="projectsCount" />
                <Table.Column<CategoryRow>
                    render={(_, row) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={row.id} />
                            <DeleteButton
                                hideText
                                size="small"
                                recordItemId={row.id}
                                confirmTitle="تمسح التصنيف ده؟ مشاريعه هتفضل من غير تصنيف."
                                confirmOkText="امسح"
                                confirmCancelText="إلغاء"
                            />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
}

function CategoryForm() {
    return (
        <Card style={{ maxWidth: 640 }}>
            <Form.Item name="nameAr" label="الاسم بالعربية" rules={required}>
                <Input maxLength={100} />
            </Form.Item>
            <Form.Item name="nameEn" label="الاسم بالإنجليزية" rules={required}>
                <Input maxLength={100} dir="ltr" />
            </Form.Item>
            <Form.Item name="slug" label="الرابط (slug)" rules={required} extra={<Hint text="حروف إنجليزية صغيرة وشرطات بس، وبيظهر في رابط التصفية زي ?category=ecommerce" />}>
                <Input maxLength={60} dir="ltr" />
            </Form.Item>
            <Form.Item name="icon" label="الأيقونة" rules={required} extra="ابحث بالإنجليزي، مثلاً: shopping-cart أو plane (أيقونات lucide.dev).">
                <IconPicker />
            </Form.Item>
        </Card>
    );
}

export function CategoryCreate() {
    const { formProps, saveButtonProps } = useForm<CategoryRow>({ redirect: 'list' });
    return (
        <Create title="تصنيف جديد" saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical" initialValues={{ icon: 'layout-grid' }}>
                <CategoryForm />
            </Form>
        </Create>
    );
}

export function CategoryEdit() {
    const { formProps, saveButtonProps } = useForm<CategoryRow>({ redirect: 'list' });
    return (
        <Edit title="تعديل التصنيف" saveButtonProps={saveButtonProps} deleteButtonProps={{ confirmTitle: 'تمسح التصنيف ده؟', confirmOkText: 'امسح', confirmCancelText: 'إلغاء' }}>
            <Form {...formProps} layout="vertical">
                <CategoryForm />
            </Form>
        </Edit>
    );
}
