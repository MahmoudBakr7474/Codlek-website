import { App, Button, Space, Tooltip } from 'antd';
import { useEffect, useRef } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2 } from 'lucide-react';
import type { HttpError } from '@refinedev/core';
import { api } from '../../lib/http';

/**
 * The article editor (HTML), with the Filament toolbar: bold, italic, link, h2/h3,
 * lists, quote, pictures (uploaded and stored as WebP), undo/redo. The site
 * sanitizes the HTML when it shows it.
 */
export function RichText({ value, onChange, dir = 'rtl' }: { value?: string; onChange?: (html: string) => void; dir?: 'rtl' | 'ltr' }) {
    const { message } = App.useApp();
    const fileInput = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }), Image],
        content: value ?? '',
        editorProps: { attributes: { dir, class: 'rich-text' } },
        onUpdate: ({ editor: current }) => onChange?.(current.isEmpty ? '' : current.getHTML()),
    });

    // The form fills its values after the editor exists (and again after a save).
    useEffect(() => {
        if (editor && (value ?? '') !== (editor.isEmpty ? '' : editor.getHTML())) {
            editor.commands.setContent(value ?? '', { emitUpdate: false });
        }
    }, [editor, value]);

    async function insertImage(file: File) {
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('preset', 'post-attachments');
            const { url } = await api<{ url: string }>('/uploads', { method: 'POST', body: form });
            editor?.chain().focus().setImage({ src: url, alt: '' }).run();
        } catch (error) {
            message.error((error as HttpError).message);
        }
    }

    return (
        <div className="rich-text-box">
            {editor && <Toolbar editor={editor} onImage={() => fileInput.current?.click()} />}
            <EditorContent editor={editor} />
            <input
                ref={fileInput}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                hidden
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void insertImage(file);
                }}
            />
        </div>
    );
}

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
    const button = (title: string, icon: React.ReactNode, run: () => void, active = false) => (
        <Tooltip title={title}>
            <Button size="small" type={active ? 'primary' : 'text'} icon={icon} onClick={run} aria-label={title} />
        </Tooltip>
    );

    return (
        <Space size={2} wrap className="rich-text-toolbar">
            {button('عريض', <Bold size={16} />, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
            {button('مائل', <Italic size={16} />, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
            {button(
                'رابط',
                <Link2 size={16} />,
                () => {
                    const current = editor.getAttributes('link').href as string | undefined;
                    const url = window.prompt('الرابط (اتركه فاضي عشان تشيل الرابط)', current ?? 'https://');
                    if (url === null) return;
                    if (url.trim() === '') editor.chain().focus().unsetLink().run();
                    else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
                },
                editor.isActive('link'),
            )}
            {button('عنوان كبير', <Heading2 size={16} />, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
            {button('عنوان صغير', <Heading3 size={16} />, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
            {button('نقاط', <List size={16} />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
            {button('قائمة مرقّمة', <ListOrdered size={16} />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
            {button('اقتباس', <Quote size={16} />, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
            {button('صورة', <ImagePlus size={16} />, onImage)}
            {button('تراجع', <Undo2 size={16} />, () => editor.chain().focus().undo().run())}
            {button('إعادة', <Redo2 size={16} />, () => editor.chain().focus().redo().run())}
        </Space>
    );
}
