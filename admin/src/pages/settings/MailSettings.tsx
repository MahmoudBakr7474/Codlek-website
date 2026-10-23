import { SendOutlined } from '@ant-design/icons';
import { Alert, App, Button, Form, Select, Switch } from 'antd';
import type { HttpError } from '@refinedev/core';
import { Hint } from '../../components/form/Hint';
import { Section } from '../../components/form/Section';
import { SettingsPage } from '../../components/settings/SettingsPage';
import { TextFields } from '../../components/settings/TextFields';
import { api } from '../../lib/http';
import { useSiteInfo } from '../../lib/siteInfo';

const SETTING_KEYS = ['mail.notify_emails', 'mail.send_confirmation'];
const TEXT_KEYS = ['mail.contact_subject', 'mail.application_subject', 'mail.confirmation_subject'];

function TestMailButton() {
    const { modal, message } = App.useApp();
    const site = useSiteInfo();

    return (
        <Button
            icon={<SendOutlined />}
            onClick={() =>
                modal.confirm({
                    title: 'نبعت إيميل تجريبي؟',
                    content: `هيتبعت لـ: ${site?.notifyEmails.join('، ') ?? ''} (احفظ التغييرات الأول لو غيرت الإيميلات).`,
                    okText: 'ابعت',
                    cancelText: 'إلغاء',
                    onOk: async () => {
                        try {
                            await api('/mail/test', { method: 'POST' });
                            message.success('اتبعت. لو ماوصلش خلال دقيقة، بص على مجلد السبام.');
                        } catch (error) {
                            message.error(`الإرسال فشل: ${(error as HttpError).message}`, 8);
                        }
                    },
                })
            }
        >
            إرسال إيميل تجريبي
        </Button>
    );
}

export function MailSettings() {
    const site = useSiteInfo();
    const sending = site && site.mailDriver !== 'log';

    return (
        <SettingsPage title="البريد والإشعارات" settingKeys={SETTING_KEYS} textKeys={TEXT_KEYS} extraActions={<TestMailButton />}>
            {site && (
                <Alert
                    type={sending ? 'success' : 'warning'}
                    showIcon
                    style={{ marginBottom: 24 }}
                    message={sending ? `الإرسال شغال عن طريق ${site.mailDriver.toUpperCase()}` : 'الإيميلات مش بتتبعت فعلاً دلوقتي'}
                    description={
                        sending
                            ? 'جرّب زرار «إرسال إيميل تجريبي» فوق عشان تتأكد إن الرسايل بتوصل.'
                            : 'إعدادات البريد (Mail:Driver) على «log»، فالإيميلات بتتكتب في ملفات ومش بتوصل لحد. الرسايل والطلبات نفسها بتتحفظ في اللوحة عادي. بعد ضبط SMTP أو Resend على الاستضافة جرّب الإيميل التجريبي.'
                    }
                />
            )}

            <Section title="مين يستلم" description="كل رسالة من فورم التواصل وكل طلب توظيف بيتبعت للإيميلات دي.">
                <Form.Item
                    name={['settings', 'mail.notify_emails']}
                    label="إيميلات الإشعارات"
                    rules={[{ required: true, message: 'اكتب إيميل واحد على الأقل.' }]}
                    extra="ممكن أكتر من إيميل: اكتب الإيميل واضغط Enter."
                >
                    <Select mode="tags" tokenSeparators={[',', ' ']} open={false} placeholder="اكتب الإيميل واضغط Enter" style={{ direction: 'ltr' }} />
                </Form.Item>
            </Section>

            <Section title="رد تلقائي للعميل" description="رسالة قصيرة بتوصل لصاحب الرسالة إن رسالته وصلت. مش بتكرر أي حاجة هو كتبها، فمحدش يقدر يستخدمها في إرسال سبام.">
                <Form.Item name={['settings', 'mail.send_confirmation']} label="ابعت للعميل إيميل تأكيد" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Section>

            <Section title="عناوين الإيميلات" description={<Hint text="عنوان كل إيميل (Subject). :service بتتبدل باسم الخدمة، و :job باسم الوظيفة." />}>
                <TextFields
                    fields={{
                        'mail.contact_subject': 'إيميل رسالة تواصل جديدة',
                        'mail.application_subject': 'إيميل طلب توظيف جديد',
                        'mail.confirmation_subject': 'إيميل التأكيد للعميل',
                    }}
                />
            </Section>
        </SettingsPage>
    );
}
