import { ExportOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useGetIdentity, useLogout } from '@refinedev/core';
import { Avatar, Button, Layout, Space, Typography, theme } from 'antd';
import { Link } from 'react-router';
import type { Identity } from '../providers/authProvider';
import { useSiteInfo } from '../lib/siteInfo';

/** The bar above every page: who is signed in (opens their account), the site, sign out. */
export function Header() {
    const { token } = theme.useToken();
    const { data: user } = useGetIdentity<Identity>();
    const { mutate: logout } = useLogout();
    const site = useSiteInfo();

    return (
        <Layout.Header
            style={{
                background: token.colorBgElevated,
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 12,
                paddingInline: 24,
                height: 64,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}
        >
            <Space size={12}>
                {site && (
                    <Button icon={<ExportOutlined />} href={site.siteUrl} target="_blank">
                        عرض الموقع
                    </Button>
                )}
                <Link to="/account" title="حسابي">
                    <Space size={8}>
                        <Avatar icon={<UserOutlined />} style={{ background: token.colorPrimary }} />
                        <Typography.Text strong>{user?.name}</Typography.Text>
                    </Space>
                </Link>
                <Button icon={<LogoutOutlined />} onClick={() => logout()}>
                    خروج
                </Button>
            </Space>
        </Layout.Header>
    );
}
