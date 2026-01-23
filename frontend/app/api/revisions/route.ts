import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'investor_news.db');

export async function GET(request: NextRequest) {
    try {
        const db = new Database(DB_PATH, { readonly: true });

        // Fetch recent revisions (limit 50)
        // Order by revision_date DESC, then created_at DESC
        const stmt = db.prepare(`
            SELECT * FROM revisions 
            ORDER BY revision_date DESC, id DESC 
            LIMIT 50
        `);

        const revisions = stmt.all();

        return NextResponse.json({ revisions });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
    }
}
