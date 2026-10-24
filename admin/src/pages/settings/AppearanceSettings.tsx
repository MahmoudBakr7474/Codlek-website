import { ReloadOutlined } from '@ant-design/icons';
import { Button, Form, Radio, Space, Switch, Typography } from 'antd';
import { useState } from 'react';
import { Section } from '../../components/form/Section';
import { BLUE, MARK_BAR, WORD } from '../../components/Logo';
import { SettingsPage } from '../../components/settings/SettingsPage';

const SETTING_KEYS = ['appearance.loader', 'appearance.theme', 'appearance.floating_contact'];

// The same animation as the site's PageLoader.
const css = `
.cl-svg { display: block; height: 56px; width: auto; overflow: visible; animation: cl-center .55s cubic-bezier(.2,.7,.2,1) .6s both; }
.cl-piece { fill: currentColor; transform-box: fill-box; transform-origin: center; animation: cl-pop .5s cubic-bezier(.34,1.56,.64,1) both; }
.cl-piece:nth-child(2) { animation-delay: .09s; }
.cl-bar, .cl-accent { fill: ${BLUE}; transform-box: fill-box; }
.cl-bar { transform-origin: left center; animation: cl-slide .5s cubic-bezier(.2,.7,.2,1) .2s both; }
.cl-accent { transform-origin: center; animation: cl-dock .55s cubic-bezier(.34,1.4,.64,1) .36s both, cl-breathe 1.4s ease-in-out 1.3s infinite; }
.cl-accent + .cl-accent { animation-delay: .46s, 1.5s; }
.cl-word { fill: currentColor; animation: cl-word .5s cubic-bezier(.2,.7,.2,1) .62s both; }
@keyframes cl-pop { from { opacity: 0; transform: scale(.3); } }
@keyframes cl-slide { from { opacity: 0; transform: translateX(14px) scaleX(.4); } }
@keyframes cl-dock { from { opacity: 0; transform: translate(14px,-22px) rotate(90deg) scale(.5); } }
@keyframes cl-breathe { 50% { transform: scale(.72); } }
@keyframes cl-word { from { opacity: 0; transform: translateX(-10px); } }
@keyframes cl-center { from { transform: translateX(37.99%); } }`;

/** The site's loader logo assembling, replayed with the button. */
function LoaderPreview() {
    const [run, setRun] = useState(0);
    return (
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
            <style>{css}</style>
            <div className="loader-preview" key={run}>
                <div style={{ direction: 'ltr' }}>
                    <svg className="cl-svg" viewBox="0 0 254 61">
                        <path className="cl-piece" d="M0 28A28 28 0 0 1 28 0V28Z" />
                        <path className="cl-piece" d="M0 33H28V61A28 28 0 0 1 0 33Z" />
                        <path className="cl-bar" d={MARK_BAR} />
                        <rect className="cl-accent" x="33" y="49" width="12" height="12" rx="3" />
                        <rect className="cl-accent" x="49" y="49" width="12" height="12" rx="3" />
                        <path className="cl-word" d={WORD} />
                    </svg>
                </div>
            </div>
            <Button icon={<ReloadOutlined />} onClick={() => setRun((n) => n + 1)}>
                إعادة العرض
            </Button>
        </Space>
    );
}

export function AppearanceSettings() {
    return (
        <SettingsPage title="المظهر وشاشة التحميل" settingKeys={SETTING_KEYS} textKeys={[]} viewPath="/">
            <Section title="شاشة التحميل" description="اللوجو بيتركّب قدام الزائر لحد ما الصفحة تجهز، وبعدها بيختفي لوحده. عمره ما بيأخّر الصفحة أكتر من اللازم.">
                <LoaderPreview />
                <Form.Item name={['settings', 'appearance.loader']} label="تظهر إمتى">
                    <Radio.Group>
                        <Space direction="vertical">
                            <Radio value="always">
                                <b>لحد ما الصفحة الأولى تجهز</b>
                                <br />
                                <Typography.Text type="secondary">
                                    المستحسن: اللوجو بيغطي وقت التحميل بس. على النت البطيء بيظهر لحد ما الصفحة تجهز، ولو فتحت بسرعة بتظهر بنعومة. التنقل بين الصفحات بعدها بيبقى فوري.
                                </Typography.Text>
                            </Radio>
                            <Radio value="session">
                                <b>ترحيب كامل في أول صفحة بس</b>
                                <br />
                                <Typography.Text type="secondary">اللوجو بيتركّب كامل (حوالي ثانية) أول ما الزائر يدخل الموقع، والصفحات بعدها بتفتح على طول.</Typography.Text>
                            </Radio>
                            <Radio value="off">
                                <b>من غير شاشة تحميل</b>
                                <br />
                                <Typography.Text type="secondary">الصفحة بتظهر على طول.</Typography.Text>
                            </Radio>
                        </Space>
                    </Radio.Group>
                </Form.Item>
            </Section>

            <Section title="الوضع الافتراضي" description="اللي يشوفه الزائر أول مرة. يقدر يغيّره بزرار القمر في الهيدر، واختياره بيتحفظ عنده.">
                <Form.Item name={['settings', 'appearance.theme']}>
                    <Radio.Group>
                        <Space direction="vertical">
                            <Radio value="light">فاتح</Radio>
                            <Radio value="dark">غامق</Radio>
                            <Radio value="system">
                                زي جهاز الزائر
                                <br />
                                <Typography.Text type="secondary">لو موبايل أو كمبيوتر الزائر على الوضع الليلي، الموقع يفتح غامق.</Typography.Text>
                            </Radio>
                        </Space>
                    </Radio.Group>
                </Form.Item>
            </Section>

            <Section title="زرار التواصل العائم" description="الدايرة اللي في ركن الشاشة وفيها واتساب والاتصال وحسابات السوشيال.">
                <Form.Item name={['settings', 'appearance.floating_contact']} label="يظهر في كل الصفحات" valuePropName="checked">
                    <Switch />
                </Form.Item>
            </Section>
        </SettingsPage>
    );
}
