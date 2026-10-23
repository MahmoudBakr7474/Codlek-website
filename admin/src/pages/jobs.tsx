import { Create, DeleteButton, Edit, EditButton, List, useForm, useTable } from '@refinedev/antd';
import { Card, Col, Form, Input, Row, Space, Switch, Table, Tag, Typography } from 'antd';
import { Bilingual } from '../components/form/Bilingual';
import { dirFor, suffix } from '../components/form/lang';
import { OrderButtons, SearchBox, ToggleCell } from '../components/list';

type JobRow = {
    id: number;
    titleAr: string;
    titleEn: string;
    departmentAr: string;
    departmentEn: string;
    locationAr: string;
    locationEn: string;
    typeAr: string;
    typeEn: string;
    descriptionAr: string;
    descriptionEn: string;
    isActive: boolean;
    sortOrder: number;
    applicationsCount: number;
};

const required = [{ required: true, message: 'الحقل ده مطلوب.' }];

/** A job with applications can't be deleted (the API says so): switching it off hides it instead. */
const deleteConfirm = { confirmTitle: 'تمسح الوظيفة دي؟', confirmOkText: 'امسح', confirmCancelText: 'إلغاء' };

export function JobList() {
    const { tableProps, setFilters, filters, tableQuery } = useTable<JobRow>({ pagination: { mode: 'off' }, syncWithLocation: false });
    const rows = tableQuery.data?.data ?? [];
    const filtered = filters.some((f) => 'value' in f && f.value);

    return (
        <List title="الوظائف">
            <Space style={{ marginBottom: 16 }}>
                <SearchBox setFilters={setFilters} />
            </Space>
            <Table {...tableProps} rowKey="id" pagination={false}>
                <Table.Column<JobRow>
                    width={70}
                    title="الترتيب"
                    render={(_, __, index) => (
                        <OrderButtons resource="job-openings" ids={rows.map((r) => r.id)} index={index} disabled={filtered} onMoved={() => tableQuery.refetch()} />
                    )}
                />
                <Table.Column<JobRow>
                    title="الوظيفة"
                    render={(_, row) => (
                        <>
                            <Typography.Text strong>{row.titleAr}</Typography.Text>
                            <br />
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                {row.departmentAr}
                            </Typography.Text>
                        </>
                    )}
                />
                <Table.Column<JobRow> title="المكان" dataIndex="locationAr" />
                <Table.Column<JobRow> title="الطلبات" render={(_, row) => <Tag color={row.applicationsCount ? 'blue' : undefined}>{row.applicationsCount}</Tag>} />
                <Table.Column<JobRow> title="متاحة" render={(_, row) => <ToggleCell resource="job-openings" id={row.id} field="isActive" value={row.isActive} />} />
                <Table.Column<JobRow>
                    render={(_, row) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={row.id} />
                            <DeleteButton hideText size="small" recordItemId={row.id} {...deleteConfirm} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
}

function JobForm() {
    return (
        <Card>
            <Bilingual>
                {(lang) => {
                    const field = (base: string) => `${base}${lang === 'ar' ? 'Ar' : 'En'}`;
                    return (
                        <>
                            <Form.Item name={field('title')} label={`المسمى الوظيفي${suffix(lang)}`} rules={required}>
                                <Input maxLength={150} dir={dirFor(lang)} />
                            </Form.Item>
                            <Row gutter={12}>
                                <Col xs={24} md={8}>
                                    <Form.Item name={field('department')} label={`القسم${suffix(lang)}`} rules={required}>
                                        <Input maxLength={80} dir={dirFor(lang)} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item name={field('location')} label={`المكان${suffix(lang)}`} rules={required}>
                                        <Input maxLength={80} dir={dirFor(lang)} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item name={field('type')} label={`نوع الدوام${suffix(lang)}`} rules={required}>
                                        <Input maxLength={60} dir={dirFor(lang)} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item name={field('description')} label={`الوصف${suffix(lang)}`} rules={required}>
                                <Input.TextArea maxLength={2000} autoSize={{ minRows: 4 }} dir={dirFor(lang)} />
                            </Form.Item>
                        </>
                    );
                }}
            </Bilingual>
            <Form.Item name="isActive" label="متاحة للتقديم" valuePropName="checked">
                <Switch />
            </Form.Item>
        </Card>
    );
}

export function JobCreate() {
    const { formProps, saveButtonProps } = useForm<JobRow>({ redirect: 'list' });
    return (
        <Create title="وظيفة جديدة" saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical" initialValues={{ isActive: true }}>
                <JobForm />
            </Form>
        </Create>
    );
}

export function JobEdit() {
    const { formProps, saveButtonProps } = useForm<JobRow>({ redirect: false });
    return (
        <Edit title="تعديل الوظيفة" saveButtonProps={saveButtonProps} deleteButtonProps={deleteConfirm}>
            <Form {...formProps} layout="vertical">
                <JobForm />
            </Form>
        </Edit>
    );
}
