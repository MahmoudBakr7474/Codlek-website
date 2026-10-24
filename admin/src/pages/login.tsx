import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useLogin } from '@refinedev/core';
import { Alert, Button, Card, Checkbox, Form, Input, Typography } from 'antd';
import { Logo } from '../components/Logo';

type Fields = { email: string; password: string; remember: boolean };

export function LoginPage() {
    const { mutate: login, isPending, data } = useLogin<Fields>();
    const failed = data?.success === false ? data.error : null;

    return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, background: '#F5F7FA' }}>
            <Card style={{ width: '100%', maxWidth: 400 }}>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 20px', color: '#0B1B3F' }}>
                    <Logo height={34} />
                </div>
                <Typography.Title level={4} style={{ textAlign: 'center', marginTop: 0 }}>
                    تسجيل الدخول للوحة التحكم
                </Typography.Title>

                {failed?.message && <Alert type="error" showIcon message={failed.message} style={{ marginBottom: 16 }} />}

                <Form<Fields> layout="vertical" requiredMark={false} initialValues={{ remember: true }} onFinish={(values) => login(values)}>
                    <Form.Item name="email" label="البريد الإلكتروني" rules={[{ required: true, message: 'اكتب الإيميل.' }, { type: 'email', message: 'الإيميل مكتوب غلط.' }]}>
                        <Input prefix={<MailOutlined />} dir="ltr" autoComplete="username" size="large" />
                    </Form.Item>
                    <Form.Item name="password" label="كلمة السر" rules={[{ required: true, message: 'اكتب كلمة السر.' }]}>
                        <Input.Password prefix={<LockOutlined />} dir="ltr" autoComplete="current-password" size="large" />
                    </Form.Item>
                    <Form.Item name="remember" valuePropName="checked">
                        <Checkbox>افتكرني على الجهاز ده</Checkbox>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" size="large" block loading={isPending}>
                        دخول
                    </Button>
                </Form>
            </Card>
        </div>
    );
}
