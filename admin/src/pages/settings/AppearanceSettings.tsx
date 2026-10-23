import { ReloadOutlined } from '@ant-design/icons';
import { Button, Form, Radio, Space, Switch, Typography } from 'antd';
import { useState } from 'react';
import { Section } from '../../components/form/Section';
import { SettingsPage } from '../../components/settings/SettingsPage';

const SETTING_KEYS = ['appearance.loader', 'appearance.theme', 'appearance.floating_contact'];

const WORD =
    'M2017 1112q-97 0-167-44-69-43-106-118-38-75-38-169 0-95 39-170 39-75 109-118 70-43 166-43 110 0 185 56 76 56 96 153l-157 42q-14-49-49-76-34-27-78-27-50 0-81 24-32 24-47 65-16 42-16 94 0 82 37 133 36 50 107 50 54 0 81-24 28-24 42-70l161 34q-26 100-100 154-75 54-184 54m619 0q-95 0-166-43-72-42-111-117-40-74-40-171 0-98 40-172 41-75 112-117 72-42 165-42 94 0 166 43 71 42 111 117 40 74 40 171 0 98-40 172-40 75-112 117-71 42-165 42m0-148q76 0 113-51 37-51 37-132 0-83-38-133-38-50-112-50-52 0-85 23-33 23-49 64-16 42-16 96 0 84 38 134 38 49 112 49m653 148q-87 0-152-44-65-43-101-118-36-75-36-169 0-96 37-170 36-75 103-118 67-43 157-43 83 0 141 38v-229h159v835h-139v-36q-6 6-13 10-63 44-156 44m25-141q53 0 85-23 31-24 45-67 14-43 14-100 0-57-14-100-14-43-44-66-31-24-80-24-53 0-87 26-34 25-50 69-16 43-16 95 0 53 16 96 15 43 48 69 32 25 83 25m569 123h-158v-852h158v852m418 18q-96 0-169-42-74-41-115-114-42-73-42-167 0-102 41-178 41-76 112-118 71-43 164-43 99 0 168 47 69 46 102 130 33 84 23 198h-440q8 56 36 91 37 48 111 48 46 0 80-20 33-20 50-59l158 46q-36 86-112 133-76 48-167 48m-152-404h276q-7-51-26-79-31-42-100-42-81 0-118 49-22 29-32 72m680 386h-161l1-835h160v510l212-301h195l-226 313 241 313h-205l-217-301v301';

const css = `
.cl-svg { display: block; height: 56px; width: auto; overflow: visible; animation: cl-center .55s cubic-bezier(.2,.7,.2,1) .6s both; }
.cl-piece { fill: currentColor; transform-box: fill-box; transform-origin: center; animation: cl-pop .5s cubic-bezier(.34,1.56,.64,1) both; }
.cl-piece:nth-child(2) { animation-delay: .09s; }
.cl-piece:nth-child(3) { animation-delay: .18s; }
.cl-accent { fill: #DB551D; transform-box: fill-box; transform-origin: center; animation: cl-dock .55s cubic-bezier(.34,1.4,.64,1) .38s both, cl-breathe 1.4s ease-in-out 1.3s infinite; }
.cl-word { fill: currentColor; animation: cl-word .5s cubic-bezier(.2,.7,.2,1) .62s both; }
@keyframes cl-pop { from { opacity: 0; transform: scale(.3); } }
@keyframes cl-dock { from { opacity: 0; transform: translate(18px,-24px) rotate(90deg) scale(.5); } }
@keyframes cl-breathe { 50% { transform: scale(.72); } }
@keyframes cl-word { from { opacity: 0; transform: translateX(-10px); } }
@keyframes cl-center { from { transform: translateX(37.6%); } }`;

/** The site's loader logo assembling, replayed with the button. */
function LoaderPreview() {
    const [run, setRun] = useState(0);
    return (
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
            <style>{css}</style>
            <div className="loader-preview" key={run}>
                <div style={{ direction: 'ltr' }}>
                    <svg className="cl-svg" viewBox="0 0 262.6 65">
                        <path className="cl-piece" d="M30 30H0A30 30 0 0 1 30 0Z" />
                        <path className="cl-piece" d="M35 0H65V30H35Z" />
                        <path className="cl-piece" d="M0 35H30V65A30 30 0 0 1 0 35Z" />
                        <rect className="cl-accent" x="50" y="50" width="15" height="15" rx="4" />
                        <g className="cl-word">
                            <path transform="scale(.05)" d={WORD} />
                        </g>
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
