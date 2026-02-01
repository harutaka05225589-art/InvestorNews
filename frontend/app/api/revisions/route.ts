import { NextRequest, NextResponse } from 'next/server';
import db, { getRevisions, getRevisionsByDateRange } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter'); // 'today', 'month'

        let revisions: any[] = [];

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
            const search = searchParams.get('q');
            if (search) {
                const stmt = db.prepare(`
                    SELECT * FROM revisions
                    WHERE title NOT IN ('System_Dividend_Update', 'YahooFinance_Initial')
                    AND (title LIKE ? OR content LIKE ?)
                    ORDER BY revision_date DESC, id DESC
                    LIMIT 550
                `);
                revisions = stmt.all(`%${search}%`, `%${search}%`) as any[];
            } else {
                const stmt = db.prepare(`
                    SELECT * FROM revisions
                    WHERE title NOT IN ('System_Dividend_Update', 'YahooFinance_Initial')
                    ORDER BY revision_date DESC, id DESC
                    LIMIT 50
                `);
                revisions = stmt.all() as any[];
            }
        }

        return NextResponse.json({ revisions });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
    }
}
