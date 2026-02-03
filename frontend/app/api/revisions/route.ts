import { NextRequest, NextResponse } from 'next/server';
import db, { getRevisions, getRevisionsByDateRange } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter'); // 'today', 'month'

        let revisions: any[] = [];

        const category = searchParams.get('category');

        if (filter === 'today') {
            const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;
            revisions = getRevisionsByDateRange(dateStr, dateStr, category || 'earnings');
        } else if (filter === 'month') {
            const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const startDate = `${y}-${m}-01`;
            const endDate = `${y}-${m}-31`;
            revisions = getRevisionsByDateRange(startDate, endDate, category || 'earnings');
        } else if (filter === 'week') {
            const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
            const day = now.getDay(); // 0 (Sun) - 6 (Sat)
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
            const start = new Date(now.setDate(diff));

            const end = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

            // Allow searching up to end of week? or just recent 7 days? 
            // Usually "This Week" means Monday to Sunday.
            // Let's use simple logic: Last 7 days or Start of Week?
            // "Start of Week (Mon) to Today" is standard for "This Week".

            // Re-calculate to be safe string format
            const y = start.getFullYear();
            const m = String(start.getMonth() + 1).padStart(2, '0');
            const d = String(start.getDate()).padStart(2, '0');
            const startDate = `${y}-${m}-${d}`;

            // End Date (Today/Future)
            const ey = end.getFullYear();
            const em = String(end.getMonth() + 1).padStart(2, '0');
            const ed = String(end.getDate()).padStart(2, '0');
            const endDate = `${ey}-${em}-${ed}`;

            revisions = getRevisionsByDateRange(startDate, endDate, category || 'earnings');
        } else {
            const search = searchParams.get('q');
            let query = `
                SELECT * FROM revisions
                WHERE title NOT IN ('System_Dividend_Update', 'YahooFinance_Initial')
            `;
            const params: any[] = [];

            if (search) {
                query += ` AND (ticker LIKE ? OR company_name LIKE ? OR title LIKE ? OR ai_summary LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }

            // Category Filter
            if (category === 'earnings') {
                query += ` AND category IN ('earnings', 'both')`;
            } else if (category === 'dividend') {
                query += ` AND category IN ('dividend', 'both')`;
            } else if (category === 'buyback') {
                query += ` AND category = 'buyback'`;
            } else if (category === 'all') {
                // No additional filter
            } else {
                // Default: Show Earnings and Dividends (exclude pure buybacks if user wants "Performance Revisions")
                query += ` AND (title LIKE '%業績%' OR title LIKE '%差異%' OR title LIKE '%配当%' OR title LIKE '%剰余金%' OR title LIKE '%自己株式%')`;
            }

            query += ` ORDER BY revision_date DESC, id DESC LIMIT 50`;

            const stmt = db.prepare(query);
            revisions = stmt.all(...params) as any[];
        }

        return NextResponse.json({ revisions });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
    }
}
