
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'investor_news.db');

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ companies: [] });
    }

    try {
        const db = new Database(DB_PATH, { readonly: true });

        // Search in ir_events (DISTINCT to avoid duplicates)
        // Limit to 10 results for performance
        const stmt = db.prepare(`
            SELECT DISTINCT ticker, company_name as name
            FROM ir_events
            WHERE ticker LIKE ? OR company_name LIKE ?
            LIMIT 10
        `);

        const companies = stmt.all(`${query}%`, `%${query}%`);

        return NextResponse.json({ companies });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to search companies' }, { status: 500 });
    }
}
