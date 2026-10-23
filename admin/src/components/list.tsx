import { ArrowDownOutlined, ArrowUpOutlined, PictureOutlined } from '@ant-design/icons';
import { useUpdate, type BaseKey, type CrudFilter } from '@refinedev/core';
import { App, Button, Input, Select, Space, Switch } from 'antd';
import { useState } from 'react';
import type { HttpError } from '@refinedev/core';
import { api } from '../lib/http';

type SetFilters = (filters: CrudFilter[], behavior?: 'merge' | 'replace') => void;

/** The list's search box (the API's "q"). */
export function SearchBox({ setFilters, placeholder = 'بحث' }: { setFilters: SetFilters; placeholder?: string }) {
    return (
        <Input.Search
            allowClear
            placeholder={placeholder}
            style={{ maxWidth: 280 }}
            onSearch={(value) => setFilters([{ field: 'q', operator: 'eq', value: value.trim() || undefined }], 'merge')}
        />
    );
}

/** A yes / no filter ("منشور: الكل / أيوه / لأ"). */
export function YesNoFilter({ field, label, setFilters, yes = 'أيوه', no = 'لأ' }: { field: string; label: string; setFilters: SetFilters; yes?: string; no?: string }) {
    return (
        <Select
            allowClear
            placeholder={label}
            style={{ minWidth: 140 }}
            options={[
                { value: 'true', label: `${label}: ${yes}` },
                { value: 'false', label: `${label}: ${no}` },
            ]}
            onChange={(value) => setFilters([{ field, operator: 'eq', value }], 'merge')}
        />
    );
}

/** An on/off switch right in the list (published, featured, active…). */
export function ToggleCell({ resource, id, field, value }: { resource: string; id: BaseKey; field: string; value: boolean }) {
    const { mutate } = useUpdate();
    const [saving, setSaving] = useState(false);
    return (
        <Switch
            size="small"
            checked={value}
            loading={saving}
            onChange={(checked) => {
                setSaving(true);
                mutate(
                    {
                        resource,
                        id,
                        values: { [field]: checked },
                        meta: { patch: true },
                        mutationMode: 'pessimistic',
                        successNotification: false,
                    },
                    { onSettled: () => setSaving(false) },
                );
            }}
        />
    );
}

/**
 * Move a row up or down in the owner's order. The whole list is reordered at
 * once (the lists that can be ordered show every row).
 */
export function OrderButtons({ resource, ids, index, disabled, onMoved }: { resource: string; ids: BaseKey[]; index: number; disabled?: boolean; onMoved: () => void }) {
    const { message } = App.useApp();
    const move = async (to: number) => {
        const order = [...ids];
        const [row] = order.splice(index, 1);
        order.splice(to, 0, row);
        try {
            await api(`/${resource}/reorder`, { method: 'POST', body: { ids: order } });
            onMoved();
        } catch (error) {
            message.error((error as HttpError).message);
        }
    };

    return (
        <Space size={0}>
            <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={disabled || index === 0} onClick={() => void move(index - 1)} aria-label="لفوق" />
            <Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={disabled || index === ids.length - 1} onClick={() => void move(index + 1)} aria-label="لتحت" />
        </Space>
    );
}

/** A small picture in a list row. */
export function Thumb({ url, round = false, width = 70, height = 44 }: { url?: string | null; round?: boolean; width?: number; height?: number }) {
    const size = round ? { width: 40, height: 40, borderRadius: '50%' } : { width, height, borderRadius: 8 };
    return url ? (
        <img src={url} alt="" style={{ ...size, objectFit: 'cover', objectPosition: 'top', display: 'block', border: '1px solid rgb(127 127 127 / .25)' }} />
    ) : (
        <span style={{ ...size, display: 'grid', placeItems: 'center', background: 'rgb(127 127 127 / .08)' }}>
            <PictureOutlined style={{ opacity: 0.35 }} />
        </span>
    );
}
