import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic'; // Prevent caching of DB results

// DB Connection (Should be shared but initializing here for simplicity in Route Handler)
const DB_PATH = path.join(process.cwd(), 'investor_news.db');

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
        return NextResponse.json({ error: 'Year and month are required' }, { status: 400 });
    }

    // Calculate Date Range
    const startStr = `${year}-${month.padStart(2, '0')}-01`;
    // Calculate end of month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
    const endStr = `${year}-${month.padStart(2, '0')}-${endDate.getDate()}`;

    try {
        const db = new Database(DB_PATH, { readonly: true });

        // Select events for the specific month
        // Also include a buffer? No, let's just fetch the month.
        // Actually, user wants "Past Year" so maybe the frontend fetches specific months on demand.

        const listingStart = searchParams.get('listing_start');
        const listingEnd = searchParams.get('listing_end');

        try {
            const db = new Database(DB_PATH, { readonly: true });

            // Base Query
            let sql = `
            SELECT id, ticker, company_name as name, event_date as date, event_type as type, market 
            FROM ir_events 
            WHERE event_date BETWEEN ? AND ?
        `;
            const params: any[] = [startStr, endStr];

            // Apply Listing Year Filter
            if (listingStart) {
                sql += ` AND listing_year >= ?`;
                params.push(parseInt(listingStart));
            }
            if (listingEnd) {
                sql += ` AND listing_year <= ?`;
                params.push(parseInt(listingEnd));
            }

            sql += ` ORDER BY event_date ASC`;

            const stmt = db.prepare(sql);
            const events = stmt.all(...params);

            return NextResponse.json({ events });
        } catch (error) {
            console.error('Database Error:', error);
            return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
        }
    }
