import { DownloadOutlined, MailOutlined } from '@ant-design/icons';
import { DeleteButton, List, Show, useSelect, useTable } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Badge, Button, Card, Col, Descriptions, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { SearchBox } from '../components/list';
import { API } from '../lib/http';
import { formatDate, since } from '../lib/format';

type ApplicationRow = {
    id: number;
    jobOpeningId: number | null;
    jobTitle: string;
    name: string;
    email: string;
    phone: string;
    profileUrl: string | null;
    hasCv: boolean;
    cvOriginalName: string | null;
    message: string | null;
    locale: string;
    isRead: boolean;
    createdAt: string | null;
};

const cvUrl = (id: number) => `${API}/job-applications/${id}/cv`;

export function ApplicationList() {
    const navigate = useNavigate();
    const { tableProps, setFilters } = useTable<ApplicationRow>({ syncWithLocation: false });
    const { selectProps } = useSelect({ resource: 'job-openings', optionLabel: 'titleAr', optionValue: 'id', pagination: { mode: 'off' } });

    return (
        <List title="طلبات التوظيف" canCreate={false}>
            <Space wrap style={{ marginBottom: 16 }}>
                <SearchBox setFilters={setFilters} placeholder="ابحث بالاسم أو الإيميل أو التليفون" />
                <Select {...selectProps} allowClear placeholder="الوظيفة" style={{ minWidth: 200 }} onChange={(value) => setFilters([{ field: 'jobOpeningId', operator: 'eq', value }], 'merge')} />
                <Select
                    allowClear
                    placeholder="الحالة"
                    style={{ minWidth: 150 }}
                    options={[
                        { value: 'false', label: 'جديدة' },
                        { value: 'true', label: 'مقروءة' },
                    ]}
                    onChange={(value) => setFilters([{ field: 'read', operator: 'eq', value }], 'merge')}
                />
            </Space>
            <Table
                {...tableProps}
                rowKey="id"
                onRow={(row) => ({ onClick: () => navigate(`/job-applications/${row.id}`), style: { cursor: 'pointer' } })}
                locale={{ emptyText: 'مفيش طلبات توظيف.' }}
            >
                <Table.Column<ApplicationRow> width={40} render={(_, row) => <Badge status={row.isRead ? 'default' : 'processing'} />} />
                <Table.Column<ApplicationRow>
                    title="المتقدم"
                    render={(_, row) => (
                        <>
                            <Typography.Text strong={!row.isRead}>{row.name}</Typography.Text>
                            <br />
                            <Typography.Text type="secondary" dir="ltr" style={{ fontSize: 12 }}>
                                {row.email}
                            </Typography.Text>
                        </>
                    )}
                />
                <Table.Column<ApplicationRow> title="الوظيفة" render={(_, row) => <Tag>{row.jobTitle}</Tag>} />
                <Table.Column<ApplicationRow> title="CV" render={(_, row) => (row.hasCv ? <Tag color="green">مرفقة</Tag> : <Tag>—</Tag>)} />
                <Table.Column<ApplicationRow> title="التاريخ" render={(_, row) => since(row.createdAt)} />
                <Table.Column<ApplicationRow>
                    render={(_, row) => (
                        <Space onClick={(event) => event.stopPropagation()}>
                            {row.hasCv && <Button size="small" icon={<DownloadOutlined />} href={cvUrl(row.id)} aria-label="تحميل الـ CV" />}
                            <DeleteButton hideText size="small" recordItemId={row.id} confirmTitle="تمسح الطلب ده والـ CV بتاعه؟" confirmOkText="امسح" confirmCancelText="إلغاء" />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
}

export function ApplicationShow() {
    const { query } = useShow<ApplicationRow>();
    const application = query.data?.data;

    return (
        <Show title="طلب توظيف" isLoading={query.isLoading} canEdit={false}>
            {application && (
                <Row gutter={24}>
                    <Col xs={24} lg={16}>
                        <Card title="الطلب">
                            <Descriptions column={1} layout="vertical">
                                <Descriptions.Item label="الوظيفة">
                                    <Tag color="blue">{application.jobTitle}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="رسالة المتقدم">
                                    <Typography.Paragraph dir="auto" style={{ whiteSpace: 'pre-line', margin: 0 }}>
                                        {application.message || '—'}
                                    </Typography.Paragraph>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="المتقدم">
                            <Descriptions column={1}>
                                <Descriptions.Item label="الاسم">{application.name}</Descriptions.Item>
                                <Descriptions.Item label="البريد">
                                    <Typography.Link href={`mailto:${application.email}`} copyable dir="ltr">
                                        {application.email}
                                    </Typography.Link>
                                </Descriptions.Item>
                                <Descriptions.Item label="الهاتف">
                                    <Typography.Link href={`tel:${application.phone}`} copyable>
                                        <bdi dir="ltr">{application.phone}</bdi>
                                    </Typography.Link>
                                </Descriptions.Item>
                                {application.profileUrl && (
                                    <Descriptions.Item label="الملف الشخصي">
                                        <Typography.Link href={application.profileUrl} target="_blank" dir="ltr">
                                            {application.profileUrl}
                                        </Typography.Link>
                                    </Descriptions.Item>
                                )}
                                <Descriptions.Item label="السيرة الذاتية">{application.cvOriginalName ?? 'لم تُرفق'}</Descriptions.Item>
                                <Descriptions.Item label="لغة الموقع">{application.locale === 'en' ? 'English' : 'العربية'}</Descriptions.Item>
                                <Descriptions.Item label="وصل">{formatDate(application.createdAt, true)}</Descriptions.Item>
                            </Descriptions>
                            <Space wrap>
                                {application.hasCv && (
                                    <Button type="primary" icon={<DownloadOutlined />} href={cvUrl(application.id)}>
                                        تحميل الـ CV
                                    </Button>
                                )}
                                <Button icon={<MailOutlined />} href={`mailto:${application.email}`}>
                                    رد بالإيميل
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            )}
        </Show>
    );
}
