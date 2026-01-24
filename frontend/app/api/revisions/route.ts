import { NextRequest, NextResponse } from 'next/server';
import { getRevisions, getRevisionsByDateRange } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter'); // 'today', 'month'

        let revisions = [];

        if (filter === 'today') {
            // JST Today
            const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;
            revisions = getRevisionsByDateRange(dateStr, dateStr);
        } else if (filter === 'month') {
            // JST Month Start
            const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            // This month: YYYY-MM-01 to YYYY-MM-31 (or just > YYYY-MM-01)
            const startDate = `${y}-${m}-01`;
            const endDate = `${y}-${m}-31`; // Loose end date
            revisions = getRevisionsByDateRange(startDate, endDate);
        } else {
            revisions = getRevisions(50);
        }

        return NextResponse.json({ revisions });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
    }
}
