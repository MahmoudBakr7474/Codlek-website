import { CheckOutlined, LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useGetIdentity, type HttpError } from '@refinedev/core';
import { Alert, App, Button, Card, Form, Input, Skeleton, Typography } from 'antd';
import { useState } from 'react';
import { api } from '../lib/http';
import type { Identity } from '../providers/authProvider';

type Fields = { name: string; email: string; currentPassword: string; newPassword?: string; confirmPassword?: string };

/** The API's minimum (AdminAuth.MinPasswordLength). */
const MIN_PASSWORD = 10;

/**
 * The signed-in admin's name, email and password (the name in the header opens
 * it). Saving needs the current password; a new password signs out the other
 * devices.
 */
export function AccountPage() {
    const { message } = App.useApp();
    const [form] = Form.useForm<Fields>();
    const [saving, setSaving] = useState(false);
    const { data: user, refetch } = useGetIdentity<Identity>();

    const save = async (values: Fields) => {
        setSaving(true);
        try {
            await api('/auth/account', {
                method: 'PUT',
                body: { name: values.name, email: values.email, currentPassword: values.currentPassword, newPassword: values.newPassword || null },
            });
            await refetch();
            form.resetFields(['currentPassword', 'newPassword', 'confirmPassword']);
            message.success(values.newPassword ? 'اتحفظ حسابك، وكلمة السر الجديدة شغالة. الأجهزة التانية اتعملها خروج.' : 'اتحفظ حسابك.');
        } catch (error) {
            const http = error as HttpError;
            if (http.errors) {
                form.setFields(Object.entries(http.errors).map(([name, messages]) => ({ name: name as keyof Fields, errors: [].concat(messages as never) })));
            }

            message.error(http.message);
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return <Skeleton active paragraph={{ rows: 6 }} />;
    }

    return (
        <div style={{ maxWidth: 560 }}>
            <Typography.Title level={3} style={{ marginTop: 0 }}>
                حسابي
            </Typography.Title>

            <Form<Fields> form={form} layout="vertical" initialValues={{ name: user.name, email: user.email }} onFinish={save}>
                <Card title="بياناتك" style={{ marginBottom: 16 }}>
                    <Form.Item name="name" label="الاسم" rules={[{ required: true, whitespace: true, message: 'الحقل ده مطلوب.' }]}>
                        <Input prefix={<UserOutlined />} maxLength={255} autoComplete="name" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="البريد الإلكتروني"
                        extra="الإيميل اللي بتدخل بيه اللوحة."
                        rules={[{ required: true, message: 'الحقل ده مطلوب.' }, { type: 'email', message: 'الإيميل مكتوب غلط.' }]}
                    >
                        <Input prefix={<MailOutlined />} maxLength={255} dir="ltr" autoComplete="username" />
                    </Form.Item>
                </Card>

                <Card title="كلمة السر" style={{ marginBottom: 16 }}>
                    <Form.Item name="newPassword" label="كلمة سر جديدة" extra={`سيبها فاضية لو مش عايز تغيّرها. ${MIN_PASSWORD} حروف على الأقل.`} rules={[{ min: MIN_PASSWORD, message: `${MIN_PASSWORD} حروف على الأقل.` }]}>
                        <Input.Password prefix={<LockOutlined />} dir="ltr" autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="اكتب كلمة السر الجديدة تاني"
                        dependencies={['newPassword']}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator: (_, value) =>
                                    (value ?? '') === (getFieldValue('newPassword') ?? '') ? Promise.resolve() : Promise.reject(new Error('مش زي كلمة السر الجديدة.')),
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} dir="ltr" autoComplete="new-password" />
                    </Form.Item>
                    <Alert type="info" showIcon message="تغيير كلمة السر بيعمل خروج من أي جهاز تاني فاتح اللوحة." />
                </Card>

                <Card>
                    <Form.Item name="currentPassword" label="كلمة السر الحالية" extra="مطلوبة عشان تحفظ أي تغيير." rules={[{ required: true, message: 'اكتب كلمة السر الحالية.' }]}>
                        <Input.Password prefix={<LockOutlined />} dir="ltr" autoComplete="current-password" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" icon={<CheckOutlined />} loading={saving}>
                        حفظ
                    </Button>
                </Card>
            </Form>
        </div>
    );
}
