/** "23 أكتوبر 2026" (Western digits, Cairo time). */
export function formatDate(iso: string | null | undefined, withTime = false): string {
    if (!iso) return '';
    return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
        timeZone: 'Africa/Cairo',
    }).format(new Date(iso));
}

/** "منذ 3 ساعات". */
export function since(iso: string | null | undefined): string {
    if (!iso) return '';
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ['year', 31536000],
        ['month', 2592000],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
    ];
    const format = new Intl.RelativeTimeFormat('ar-EG-u-nu-latn', { numeric: 'auto' });
    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
    }
    return format.format(Math.round(seconds), 'second');
}
