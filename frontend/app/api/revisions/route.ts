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
            // ... (keep existing today logic, maybe add category filtering later if needed, but for now focus on main list)
            // For simplicity, passing category to existing functions requires DB update, let's Stick to Main Query for now.
            const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
            // ...
            // NOTE: getRevisionsByDateRange assumes standard fetch. 
            // To support category, we might need a custom query here too.
            // Let's implement category filtering for the main list first which uses raw SQL below.

            // Actually, let's just use the main Custom Query block for everything if possible?
            // No, keep 'today'/'month' as is for Quick Links, they are less likely to need strict category filtering immediately unless requested.
            // But the user said "Organize them".

            // Let's modify the MAIN block (else) to filter by category.
            revisions = getRevisionsByDateRange(dateStr, dateStr);
        } else if (filter === 'month') {
            // ...
            revisions = getRevisionsByDateRange(startDate, endDate);
        } else {
            const search = searchParams.get('q');
            let query = `
                SELECT * FROM revisions
                WHERE title NOT IN ('System_Dividend_Update', 'YahooFinance_Initial')
            `;
            const params: any[] = [];

            if (search) {
                query += ` AND (title LIKE ? OR content LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`);
            }

            // Category Filter
            if (category === 'earnings') {
                query += ` AND category IN ('earnings', 'both')`;
            } else if (category === 'dividend') {
                query += ` AND category IN ('dividend', 'both')`;
            } else if (category === 'buyback') {
                query += ` AND category = 'buyback'`;
            } else {
                // Default: Show Earnings and Dividends (exclude pure buybacks if user wants "Performance Revisions")
                // User said "Extract only stocks with performance revisions".
                // So maybe defaults should be strict?
                // Let's show all by default but sort/tag. 
                // Wait, user said "Organize them... separate the code".
                // I'll show all (except buybacks maybe?) or just all.
                // Let's show ALL valid revisions (earnings, dividend, both) but maybe filter out pure 'buyback' if it's too noisy?
                // For now, let's NOT filter by default unless requested, to avoid hiding data.
                // But exclude 'general' if it's empty?
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
