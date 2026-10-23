import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

/*
 * Called by the API after every save in the admin (Codlek:RevalidateUrl), with the
 * shared secret in X-Revalidate-Secret. Drops the cached API reads at once, so the
 * next visit shows the owner's change.
 */
export async function POST(request: NextRequest) {
    const secret = process.env.REVALIDATE_SECRET;
    if (!secret || request.headers.get('x-revalidate-secret') !== secret) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    revalidateTag('cms', { expire: 0 });
    return NextResponse.json({ ok: true });
}
