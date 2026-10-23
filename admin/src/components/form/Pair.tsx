import { Col, Form, Input, Row } from 'antd';
import { Hint } from './Hint';

type PairProps = {
    /** Path of the {ar, en} value inside the form (or the list item). */
    name: (string | number)[];
    label: string;
    required?: boolean;
    max?: number;
    textarea?: boolean;
    rows?: number;
    hint?: string;
};

/**
 * Arabic and English side by side, for a bilingual value inside a list item
 * (stored as {ar, en}).
 */
export function Pair({ name, label, required = true, max = 255, textarea = false, rows = 3, hint }: PairProps) {
    const rules = required ? [{ required: true, message: 'الحقل ده مطلوب.' }] : [];
    return (
        <Row gutter={12}>
            {(['ar', 'en'] as const).map((lang) => (
                <Col xs={24} md={12} key={lang}>
                    <Form.Item
                        name={[...name, lang]}
                        label={label + (lang === 'en' ? ' (English)' : '')}
                        rules={rules}
                        extra={lang === 'ar' && hint ? <Hint text={hint} /> : undefined}
                    >
                        {textarea ? (
                            <Input.TextArea maxLength={max} autoSize={{ minRows: rows }} dir={lang === 'en' ? 'ltr' : undefined} />
                        ) : (
                            <Input maxLength={max} dir={lang === 'en' ? 'ltr' : undefined} />
                        )}
                    </Form.Item>
                </Col>
            ))}
        </Row>
    );
}
