import { CopyOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { DeleteButton, List, Show, useTable } from '@refinedev/antd';
import { useShow } from '@refinedev/core';
import { Badge, Button, Card, Col, Descriptions, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { SearchBox } from '../components/list';
import { formatDate, since } from '../lib/format';

export type MessageRow = {
    id: number;
    name: string;
    email: string;
    phone: string;
    service: string;
    serviceLabel: string;
    message: string;
    locale: string;
    isRead: boolean;
    createdAt: string | null;
};

export function MessageList() {
    const navigate = useNavigate();
    const { tableProps, setFilters } = useTable<MessageRow>({ syncWithLocation: false });

    return (
        <List title="رسائل التواصل" canCreate={false}>
            <Space wrap style={{ marginBottom: 16 }}>
                <SearchBox setFilters={setFilters} placeholder="ابحث بالاسم أو الإيميل أو التليفون" />
                <Select
                    allowClear
                    placeholder="الحالة"
                    style={{ minWidth: 150 }}
                    options={[
                        { value: 'false', label: 'غير مقروءة' },
                        { value: 'true', label: 'مقروءة' },
                    ]}
                    onChange={(value) => setFilters([{ field: 'read', operator: 'eq', value }], 'merge')}
                />
            </Space>
            <Table
                {...tableProps}
                rowKey="id"
                onRow={(row) => ({ onClick: () => navigate(`/contact-messages/${row.id}`), style: { cursor: 'pointer' } })}
                locale={{ emptyText: 'مفيش رسائل.' }}
            >
                <Table.Column<MessageRow> width={40} render={(_, row) => <Badge status={row.isRead ? 'default' : 'processing'} title={row.isRead ? 'مقروءة' : 'غير مقروءة'} />} />
                <Table.Column<MessageRow>
                    title="الاسم"
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
                <Table.Column<MessageRow> title="الخدمة" render={(_, row) => <Tag>{row.serviceLabel}</Tag>} />
                <Table.Column<MessageRow> title="الرسالة" render={(_, row) => <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, maxWidth: 420 }}>{row.message}</Typography.Paragraph>} />
                <Table.Column<MessageRow> title="التاريخ" render={(_, row) => since(row.createdAt)} />
                <Table.Column<MessageRow>
                    render={(_, row) => (
                        <span onClick={(event) => event.stopPropagation()}>
                            <DeleteButton hideText size="small" recordItemId={row.id} confirmTitle="تمسح الرسالة دي؟" confirmOkText="امسح" confirmCancelText="إلغاء" />
                        </span>
                    )}
                />
            </Table>
        </List>
    );
}

export function MessageShow() {
    const { query } = useShow<MessageRow>();
    const message = query.data?.data;

    return (
        <Show title="رسالة تواصل" isLoading={query.isLoading} canEdit={false} headerButtons={({ defaultButtons }) => defaultButtons}>
            {message && (
                <Row gutter={24}>
                    <Col xs={24} lg={16}>
                        <Card title="الرسالة">
                            <Descriptions column={1} layout="vertical">
                                <Descriptions.Item label="الخدمة المطلوبة">
                                    <Tag color="blue">{message.serviceLabel}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="تفاصيل المشروع">
                                    <Typography.Paragraph dir="auto" style={{ whiteSpace: 'pre-line', margin: 0 }}>
                                        {message.message}
                                    </Typography.Paragraph>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="المرسل">
                            <Descriptions column={1}>
                                <Descriptions.Item label="الاسم">{message.name}</Descriptions.Item>
                                <Descriptions.Item label="البريد">
                                    <Typography.Link href={`mailto:${message.email}`} copyable={{ icon: <CopyOutlined /> }} dir="ltr">
                                        {message.email}
                                    </Typography.Link>
                                </Descriptions.Item>
                                <Descriptions.Item label="الهاتف">
                                    {/* Isolated LTR, or "+971 50 123 4567" shows with its groups reversed. */}
                                    <Typography.Link href={`tel:${message.phone}`} copyable>
                                        <bdi dir="ltr">{message.phone}</bdi>
                                    </Typography.Link>
                                </Descriptions.Item>
                                <Descriptions.Item label="لغة الموقع">{message.locale === 'en' ? 'English' : 'العربية'}</Descriptions.Item>
                                <Descriptions.Item label="وصلت">{formatDate(message.createdAt, true)}</Descriptions.Item>
                            </Descriptions>
                            <Space wrap>
                                <Button icon={<MailOutlined />} href={`mailto:${message.email}`}>
                                    رد بالإيميل
                                </Button>
                                <Button icon={<PhoneOutlined />} href={`tel:${message.phone}`}>
                                    اتصال
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            )}
        </Show>
    );
}
