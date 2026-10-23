import { DeleteOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { App, Button, Space, Upload } from 'antd';
import { useState } from 'react';
import type { HttpError } from '@refinedev/core';
import { api, uploadUrl } from '../../lib/http';

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * A picture field: the value is the stored path ("projects/….webp"). The file is
 * uploaded at once and stored by the API as a web-sized WebP for its `preset`
 * (projects, services, posts, testimonials, hero, seo).
 */
export function ImageUpload({
    value,
    onChange,
    preset,
    aspect = '16 / 10',
    round = false,
    fallback,
}: {
    value?: string | null;
    onChange?: (value: string | null) => void;
    preset: string;
    aspect?: string;
    round?: boolean;
    /** What the site shows without an upload (e.g. the bundled illustration). */
    fallback?: string;
}) {
    const { message } = App.useApp();
    const [busy, setBusy] = useState(false);
    const shown = uploadUrl(value) ?? fallback;

    return (
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <div
                style={{
                    width: round ? 96 : '100%',
                    maxWidth: round ? 96 : 360,
                    aspectRatio: round ? '1' : aspect,
                    borderRadius: round ? '50%' : 12,
                    border: '1px solid rgb(127 127 127 / .3)',
                    overflow: 'hidden',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'rgb(127 127 127 / .06)',
                }}
            >
                {shown ? (
                    <img src={shown} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                ) : (
                    <PictureOutlined style={{ fontSize: 28, opacity: 0.4 }} />
                )}
            </div>
            <Space wrap>
                <Upload
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        if (file.size > MAX_BYTES) {
                            message.error('الصورة أكبر من 8 ميجا.');
                            return Upload.LIST_IGNORE;
                        }
                        return true;
                    }}
                    customRequest={async ({ file, onSuccess, onError }) => {
                        setBusy(true);
                        try {
                            const form = new FormData();
                            form.append('file', file as Blob);
                            form.append('preset', preset);
                            const { path } = await api<{ path: string }>('/uploads', { method: 'POST', body: form });
                            onChange?.(path);
                            onSuccess?.(path);
                        } catch (error) {
                            message.error((error as HttpError).message);
                            onError?.(error as Error);
                        } finally {
                            setBusy(false);
                        }
                    }}
                >
                    <Button icon={<UploadOutlined />} loading={busy}>
                        {value ? 'تغيير الصورة' : 'رفع صورة'}
                    </Button>
                </Upload>
                {value && (
                    <Button icon={<DeleteOutlined />} danger onClick={() => onChange?.(null)}>
                        إزالة
                    </Button>
                )}
            </Space>
        </Space>
    );
}
