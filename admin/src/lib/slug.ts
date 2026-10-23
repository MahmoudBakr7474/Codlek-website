/** "Web Development!" → "web-development" (the key or URL part a new item starts with). */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
