import { CheckOutlined, ExportOutlined, RollbackOutlined } from '@ant-design/icons';
import { App, Button, Form, Skeleton, Space, Typography } from 'antd';
import type { FormInstance } from 'antd';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { HttpError } from '@refinedev/core';
import { api } from '../../lib/http';
import { refreshSiteInfo, useSiteInfo } from '../../lib/siteInfo';
import { SettingsContext } from './context';

type TextValues = Record<'ar' | 'en', Record<string, { value: string; original: string }>>;
type SettingValues = { values: Record<string, unknown>; defaults: Record<string, unknown> };
type Loaded = [SettingValues, TextValues];

/** A page's settings blocks (values and originals) and page texts. */
function fetchValues(keys: string, texts: string): Promise<Loaded> {
    return Promise.all([
        keys ? api<SettingValues>('/settings', { query: { keys } }) : Promise.resolve({ values: {}, defaults: {} }),
        texts ? api<TextValues>('/texts', { query: { keys: texts } }) : Promise.resolve({ ar: {}, en: {} } as TextValues),
    ]);
}

type Props = {
    title: string;
    settingKeys: string[];
    textKeys: string[];
    /** The page on the site, for "عرض على الموقع". */
    viewPath?: string;
    extraActions?: ReactNode;
    children: ReactNode | ((form: FormInstance) => ReactNode);
};

/**
 * A settings page: loads its settings blocks and page texts, saves them with the
 * sticky button (or Ctrl+S), and "استرجاع الأصل" puts them back to the
 * originals. Form values: { settings: {key: value}, texts: {ar: {key}, en: {key}} }.
 */
export function SettingsPage({ title, settingKeys, textKeys, viewPath, extraActions, children }: Props) {
    const { message, modal } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [texts, setTexts] = useState<TextValues>({ ar: {}, en: {} });
    const [defaults, setDefaults] = useState<Record<string, unknown>>({});
    const site = useSiteInfo();
    const keys = settingKeys.join(',');
    const textList = textKeys.join(',');

    // Puts loaded values in the form. The skeleton shows only on the first load;
    // a reload after saving keeps the form on screen.
    const apply = useCallback(
        ([settings, loadedTexts]: Loaded) => {
            setTexts(loadedTexts);
            setDefaults(settings.defaults);
            form.resetFields();
            form.setFieldsValue({
                settings: settings.values,
                texts: {
                    ar: Object.fromEntries(Object.entries(loadedTexts.ar).map(([k, v]) => [k, v.value])),
                    en: Object.fromEntries(Object.entries(loadedTexts.en).map(([k, v]) => [k, v.value])),
                },
            });
            setLoading(false);
        },
        [form],
    );

    const load = useCallback(() => fetchValues(keys, textList).then(apply), [apply, keys, textList]);

    useEffect(() => {
        fetchValues(keys, textList).then(apply);
    }, [apply, keys, textList]);

    const save = useCallback(async () => {
        let values: { settings?: Record<string, unknown>; texts?: Record<string, Record<string, string>> };
        try {
            values = await form.validateFields();
        } catch {
            message.error('راجع الحقول اللي عليها علامة.');
            return;
        }

        setSaving(true);
        try {
            if (settingKeys.length) {
                await api('/settings', { method: 'PUT', body: { values: values.settings ?? {} } });
            }

            if (textKeys.length) {
                await api('/texts', { method: 'PUT', body: values.texts ?? {} });
            }

            await load();
            refreshSiteInfo(); // contact details or mail recipients may have changed
            message.success('اتحفظت التغييرات. الموقع بيعرض التعديلات دلوقتي.');
        } catch (error) {
            const http = error as HttpError;
            if (http.errors) {
                form.setFields(Object.entries(http.errors).map(([key, messages]) => ({ name: fieldPath(key, settingKeys), errors: [].concat(messages as never) })));
            }

            message.error(http.message);
        } finally {
            setSaving(false);
        }
    }, [form, load, message, settingKeys, textKeys]);

    // Ctrl+S / Cmd+S saves.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                void save();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [save]);

    const restore = () =>
        modal.confirm({
            title: 'ترجيع محتوى الصفحة دي للأصل؟',
            content: 'كل اللي اتغير في الصفحة دي هيرجع للنص والقوائم الأصلية اللي الموقع اتسلّم بيها. مفيش تراجع بعدها.',
            okText: 'أيوه، رجّعه',
            cancelText: 'إلغاء',
            okButtonProps: { danger: true },
            onOk: async () => {
                await api('/settings/reset', { method: 'POST', body: { keys: settingKeys, texts: textKeys } });
                await load();
                refreshSiteInfo();
                message.success('رجع للأصل.');
            },
        });

    const original = (lang: 'ar' | 'en', key: string) => texts[lang][key]?.original ?? '';

    return (
        <SettingsContext.Provider value={{ original, defaults }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24 }}>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    {title}
                </Typography.Title>
                <Space wrap>
                    {extraActions}
                    {viewPath && site && (
                        <Button icon={<ExportOutlined />} href={`${site.siteUrl}${viewPath}`} target="_blank">
                            عرض على الموقع
                        </Button>
                    )}
                    <Button icon={<RollbackOutlined />} onClick={restore}>
                        استرجاع الأصل
                    </Button>
                </Space>
            </div>

            {loading ? (
                <Skeleton active paragraph={{ rows: 10 }} />
            ) : (
                <Form form={form} layout="vertical" onFinish={save} scrollToFirstError>
                    {typeof children === 'function' ? children(form) : children}

                    <div className="sticky-save">
                        <Button type="primary" icon={<CheckOutlined />} loading={saving} onClick={() => void save()} size="large">
                            حفظ التغييرات
                        </Button>
                        <Typography.Text type="secondary">Ctrl + S</Typography.Text>
                    </div>
                </Form>
            )}
        </SettingsContext.Provider>
    );
}

/**
 * Where an API error goes in the form: "home.why.stats.0.value" is the field
 * ["settings", "home.why", "stats", 0, "value"]; "ar.blog.related" a page text.
 */
function fieldPath(key: string, settingKeys: string[]): (string | number)[] {
    const setting = settingKeys.filter((k) => key === k || key.startsWith(`${k}.`)).sort((a, b) => b.length - a.length)[0];
    if (setting) {
        const rest = key.slice(setting.length + 1);
        return ['settings', setting, ...(rest ? rest.split('.').map((part) => (/^\d+$/.test(part) ? Number(part) : part)) : [])];
    }

    const [lang, ...text] = key.split('.');
    return ['texts', lang, text.join('.')];
}
