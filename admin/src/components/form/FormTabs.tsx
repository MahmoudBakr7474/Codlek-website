import { Badge, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

type Item = { key: string; label: ReactNode; children: ReactNode };

/**
 * Tabs inside a form. Every tab is rendered, so its fields are validated and
 * saved while another tab is open. A tab holding a field that failed validation
 * gets a red dot, and opens by itself when it starts failing while the open tab
 * is fine (a save that failed only because of it).
 */
export function FormTabs({ items, size }: { items: Item[]; size?: TabsProps['size'] }) {
    const id = useId();
    const box = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(items[0]?.key);
    const [failing, setFailing] = useState<string[]>([]);
    const keyList = items.map((item) => item.key).join('|');

    useEffect(() => {
        const root = box.current;
        if (!root) {
            return;
        }

        const keys = keyList.split('|');
        let last: string[] = [];
        const observer = new MutationObserver(() => {
            const now = keys.filter((key) => root.querySelector(`[data-tab="${id}:${key}"] .ant-form-item-has-error`));
            const before = last;
            last = now;
            if (now.join('|') === before.join('|')) {
                return;
            }

            setFailing(now);
            setActive((open) => {
                const fresh = now.find((key) => !before.includes(key));
                return fresh && !now.includes(open) ? fresh : open;
            });
        });
        observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, [id, keyList]);

    return (
        <div ref={box}>
            <Tabs
                size={size}
                activeKey={active}
                onChange={setActive}
                items={items.map((item) => ({
                    key: item.key,
                    forceRender: true,
                    label: (
                        <span>
                            {item.label}
                            {failing.includes(item.key) && <Badge status="error" style={{ marginInlineStart: 6 }} />}
                        </span>
                    ),
                    children: <div data-tab={`${id}:${item.key}`}>{item.children}</div>,
                }))}
            />
        </div>
    );
}
