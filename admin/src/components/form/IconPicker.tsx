import { Select, Space } from 'antd';
import { useMemo, useState } from 'react';
import { DynamicIcon, iconNames, type IconName } from 'lucide-react/dynamic';

/** An icon by its Lucide name, loaded on demand. */
export function LucideIcon({ name, size = 18 }: { name?: string | null; size?: number }) {
    const known = name && (iconNames as readonly string[]).includes(name);
    return known ? <DynamicIcon name={name as IconName} size={size} /> : <span style={{ display: 'inline-block', width: size, height: size }} />;
}

/**
 * A searchable icon field that previews every icon, so nobody has to type an icon
 * name from memory. Stores the bare Lucide name ("rocket").
 */
export function IconPicker({ value, onChange }: { value?: string; onChange?: (value: string) => void }) {
    const [search, setSearch] = useState('');
    const options = useMemo(() => {
        const q = search.trim().toLowerCase();
        const names = (iconNames as readonly string[]).filter((name) => q === '' || name.includes(q)).slice(0, 60);
        if (value && !names.includes(value)) names.unshift(value);
        return names.map((name) => ({
            value: name,
            label: (
                <Space size={10}>
                    <LucideIcon name={name} />
                    <span dir="ltr">{name}</span>
                </Space>
            ),
        }));
    }, [search, value]);

    return (
        <Select
            showSearch
            value={value}
            onChange={onChange}
            onSearch={setSearch}
            filterOption={false}
            options={options}
            placeholder="ابحث بالإنجليزي، مثلاً: rocket"
            notFoundContent="مفيش أيقونة بالاسم ده."
        />
    );
}
