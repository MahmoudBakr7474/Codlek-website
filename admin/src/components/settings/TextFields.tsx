import { Form, Input } from 'antd';
import { Bilingual } from '../form/Bilingual';
import type { Lang } from '../form/lang';
import { Hint } from '../form/Hint';
import { useSettings } from './context';

export type TextSpec = string | { label: string; textarea?: boolean; hint?: string };

/**
 * Page texts (the site's UI lines) with "العربية / English" tabs. Each field shows
 * the shipped text as its placeholder, so clearing a field visibly brings the
 * original back.
 */
export function TextFields({ fields }: { fields: Record<string, TextSpec> }) {
    const { original } = useSettings();

    return (
        <Bilingual>
            {(lang: Lang) =>
                Object.entries(fields).map(([key, spec]) => {
                    const { label, textarea, hint } = typeof spec === 'string' ? { label: spec, textarea: false, hint: undefined } : spec;
                    const common = { placeholder: original(lang, key), dir: lang === 'en' ? 'ltr' : undefined };
                    return (
                        <Form.Item key={key} name={['texts', lang, key]} label={label} extra={hint ? <Hint text={hint} /> : undefined}>
                            {textarea ? <Input.TextArea {...common} maxLength={1000} autoSize={{ minRows: 2 }} /> : <Input {...common} maxLength={300} />}
                        </Form.Item>
                    );
                })
            }
        </Bilingual>
    );
}
