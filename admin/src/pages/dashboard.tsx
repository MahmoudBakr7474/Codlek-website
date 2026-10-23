import {
    AppstoreOutlined,
    ExportOutlined,
    FileTextOutlined,
    HomeOutlined,
    InboxOutlined,
    InfoCircleOutlined,
    MessageOutlined,
    PhoneOutlined,
    PlusOutlined,
    ReadOutlined,
    SafetyOutlined,
    SearchOutlined,
    EditOutlined,
    SolutionOutlined,
} from '@ant-design/icons';
import { useGetIdentity } from '@refinedev/core';
import { Badge, Button, Card, Col, Empty, Row, Space, Statistic, Table, Tag, Typography, theme } from 'antd';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../lib/http';
import { since } from '../lib/format';
import { useSiteInfo } from '../lib/siteInfo';
import type { Identity } from '../providers/authProvider';
import type { MessageRow } from './messages';

type Dashboard = {
    unreadMessages: number;
    totalMessages: number;
    unreadApplications: number;
    totalApplications: number;
    publishedProjects: number;
    totalProjects: number;
    publishedPosts: number;
    totalPosts: number;
    latestMessages: MessageRow[];
};

/** The cards that lead to the pages the owner edits most. */
const editCards: Array<{ to: string; label: string; text: string; icon: ReactNode }> = [
    { to: '/pages/home', label: 'الصفحة الرئيسية', text: 'الهيرو وصوره، ترتيب الأقسام وكل نصوصها', icon: <HomeOutlined /> },
    { to: '/services', label: 'الخدمات', text: 'كروت الخدمات وصفحتها واختيارات فورم التواصل', icon: <AppstoreOutlined /> },
    { to: '/projects', label: 'المشاريع', text: 'معرض الأعمال واللي يظهر في الرئيسية', icon: <SolutionOutlined /> },
    { to: '/testimonials', label: 'آراء العملاء', text: 'التقييمات اللي في الرئيسية', icon: <MessageOutlined /> },
    { to: '/pages/about', label: 'صفحة من نحن', text: 'القصة والقيم والأرقام', icon: <InfoCircleOutlined /> },
    { to: '/pages/texts', label: 'نصوص الصفحات', text: 'عناوين الخدمات والأعمال والمدونة والوظائف والتواصل', icon: <FileTextOutlined /> },
    { to: '/settings/contact', label: 'بيانات التواصل', text: 'الإيميل والتليفون وواتساب والسوشيال', icon: <PhoneOutlined /> },
    { to: '/settings/seo', label: 'الظهور في جوجل', text: 'عنوان الموقع ووصفه وصورة المشاركة', icon: <SearchOutlined /> },
    { to: '/pages/legal', label: 'الخصوصية والشروط', text: 'سياسة الخصوصية وشروط الاستخدام', icon: <SafetyOutlined /> },
];

export function DashboardPage() {
    const { token } = theme.useToken();
    const navigate = useNavigate();
    const { data: user } = useGetIdentity<Identity>();
    const site = useSiteInfo();
    const [data, setData] = useState<Dashboard | null>(null);

    useEffect(() => {
        api<Dashboard>('/dashboard').then(setData);
    }, []);

    const today = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    const stats = data && [
        { to: '/contact-messages', title: 'رسائل جديدة', value: data.unreadMessages, of: `من إجمالي ${data.totalMessages} رسالة`, icon: <InboxOutlined />, hot: data.unreadMessages > 0 },
        { to: '/job-applications', title: 'طلبات توظيف جديدة', value: data.unreadApplications, of: `من إجمالي ${data.totalApplications} طلب`, icon: <SolutionOutlined />, hot: data.unreadApplications > 0 },
        { to: '/projects', title: 'مشاريع منشورة', value: data.publishedProjects, of: `من إجمالي ${data.totalProjects} مشروع`, icon: <AppstoreOutlined />, hot: false },
        { to: '/posts', title: 'مقالات منشورة', value: data.publishedPosts, of: `من إجمالي ${data.totalPosts} مقال`, icon: <ReadOutlined />, hot: false },
    ];

    return (
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
                <div>
                    <Typography.Title level={3} style={{ margin: 0 }}>
                        {user?.name ? `أهلاً، ${user.name}` : 'أهلاً بيك'}
                    </Typography.Title>
                    <Typography.Text type="secondary">{today}</Typography.Text>
                </div>
                <Space wrap>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/projects/create')}>
                        مشروع جديد
                    </Button>
                    <Button icon={<EditOutlined />} onClick={() => navigate('/posts/create')}>
                        مقال جديد
                    </Button>
                    {site && (
                        <Button icon={<ExportOutlined />} href={site.siteUrl} target="_blank">
                            عرض الموقع
                        </Button>
                    )}
                </Space>
            </div>

            <Row gutter={[16, 16]}>
                {(stats ?? [0, 1, 2, 3].map(() => null)).map((stat, i) => (
                    <Col xs={24} sm={12} xl={6} key={i}>
                        <Link to={stat?.to ?? '#'}>
                            <Card hoverable loading={!stat}>
                                {stat && (
                                    <Statistic
                                        title={
                                            <Space>
                                                {stat.icon}
                                                {stat.title}
                                            </Space>
                                        }
                                        value={stat.value}
                                        valueStyle={{ color: stat.hot ? token.colorError : undefined, fontWeight: 800 }}
                                        suffix={<Typography.Text type="secondary" style={{ fontSize: 13 }}>{stat.of}</Typography.Text>}
                                    />
                                )}
                            </Card>
                        </Link>
                    </Col>
                ))}
            </Row>

            <Card title="تعديل الموقع">
                <Row gutter={[12, 12]}>
                    {editCards.map((card) => (
                        <Col xs={24} md={12} xl={8} key={card.to}>
                            <Link to={card.to}>
                                <Card size="small" hoverable>
                                    <Space align="start" size={12}>
                                        <span
                                            style={{
                                                display: 'grid',
                                                placeItems: 'center',
                                                width: 40,
                                                height: 40,
                                                borderRadius: 10,
                                                background: token.colorPrimaryBg,
                                                color: token.colorPrimary,
                                                fontSize: 18,
                                            }}
                                        >
                                            {card.icon}
                                        </span>
                                        <div>
                                            <Typography.Text strong>{card.label}</Typography.Text>
                                            <br />
                                            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                                {card.text}
                                            </Typography.Text>
                                        </div>
                                    </Space>
                                </Card>
                            </Link>
                        </Col>
                    ))}
                </Row>
            </Card>

            <Card title="آخر الرسائل" extra={<Link to="/contact-messages">كل الرسائل</Link>}>
                <Table<MessageRow>
                    rowKey="id"
                    loading={!data}
                    dataSource={data?.latestMessages ?? []}
                    pagination={false}
                    onRow={(row) => ({ onClick: () => navigate(`/contact-messages/${row.id}`), style: { cursor: 'pointer' } })}
                    locale={{ emptyText: <Empty description="مفيش رسائل لسه. أول ما حد يبعت من فورم التواصل هتظهر هنا." /> }}
                    columns={[
                        { key: 'state', width: 40, render: (_, row) => <Badge status={row.isRead ? 'default' : 'processing'} /> },
                        {
                            title: 'الاسم',
                            render: (_, row) => (
                                <>
                                    <Typography.Text strong={!row.isRead}>{row.name}</Typography.Text>
                                    <br />
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }} dir="ltr">
                                        {row.email}
                                    </Typography.Text>
                                </>
                            ),
                        },
                        { title: 'الخدمة', render: (_, row) => <Tag>{row.serviceLabel}</Tag> },
                        { title: 'الرسالة', render: (_, row) => <Typography.Text ellipsis style={{ maxWidth: 360 }}>{row.message}</Typography.Text> },
                        { title: 'وصلت', render: (_, row) => since(row.createdAt) },
                    ]}
                />
            </Card>
        </Space>
    );
}
