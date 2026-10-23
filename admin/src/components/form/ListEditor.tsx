import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, DownOutlined, LeftOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Space, Typography } from 'antd';
import type { FormListFieldData } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { useState, type ReactNode } from 'react';

type Props = {
    name: (string | number)[];
    addLabel: string;
    /** The title of an item from its current value (e.g. its Arabic title). */
    itemTitle: (value: Record<string, unknown> | undefined, index: number) => ReactNode;
    newItem?: Record<string, unknown> | (() => Record<string, unknown>);
    max?: number;
    min?: number;
    /** Items start folded when the list is longer than this. */
    foldAfter?: number;
    children: (field: FormListFieldData) => ReactNode;
};

/**
 * The Filament repeater: a list of cards that can be added, removed, moved up
 * and down and folded. Each card's fields come from `children(field)`.
 */
export function ListEditor({ name, addLabel, itemTitle, newItem = {}, max, min = 0, foldAfter = 4, children }: Props) {
    const form = Form.useFormInstance();
    const [open, setOpen] = useState<Record<number, boolean>>({});

    return (
        <Form.List name={name}>
            {(fields, { add, remove, move }, { errors }) => (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    {fields.map((field, index) => {
                        const folded = open[field.key] === undefined ? fields.length > foldAfter : !open[field.key];
                        return (
                            <Card
                                key={field.key}
                                size="small"
                                title={
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={folded ? <LeftOutlined /> : <DownOutlined />}
                                        onClick={() => setOpen((state) => ({ ...state, [field.key]: folded }))}
                                        style={{ paddingInline: 4 }}
                                    >
                                        <Form.Item noStyle shouldUpdate>
                                            {() => (
                                                <Typography.Text strong>
                                                    {itemTitle(form.getFieldValue([...name, field.name] as NamePath), index)}
                                                </Typography.Text>
                                            )}
                                        </Form.Item>
                                    </Button>
                                }
                                extra={
                                    <Space size={2}>
                                        <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => move(index, index - 1)} aria-label="لفوق" />
                                        <Button
                                            size="small"
                                            type="text"
                                            icon={<ArrowDownOutlined />}
                                            disabled={index === fields.length - 1}
                                            onClick={() => move(index, index + 1)}
                                            aria-label="لتحت"
                                        />
                                        <Button size="small" type="text" danger icon={<DeleteOutlined />} disabled={fields.length <= min} onClick={() => remove(field.name)} aria-label="مسح" />
                                    </Space>
                                }
                                styles={{ body: folded ? { display: 'none' } : undefined }}
                            >
                                {/* Folded items keep their fields mounted, so they still validate and save. */}
                                {children(field)}
                            </Card>
                        );
                    })}

                    <Form.ErrorList errors={errors} />

                    {(max === undefined || fields.length < max) && (
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                // A new item opens unfolded (Form.List keys count up).
                                const next = fields.length ? Math.max(...fields.map((f) => f.key)) + 1 : 0;
                                add(typeof newItem === 'function' ? newItem() : structuredClone(newItem));
                                setOpen((state) => ({ ...state, [next]: true }));
                            }}
                            block
                        >
                            {addLabel}
                        </Button>
                    )}
                </Space>
            )}
        </Form.List>
    );
}
