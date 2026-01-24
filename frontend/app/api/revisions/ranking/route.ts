import { NextResponse } from 'next/server';
import { getRevisionRanking } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const ranking = getRevisionRanking(50);
        return NextResponse.json({ ranking });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch ranking' }, { status: 500 });
    }
}
