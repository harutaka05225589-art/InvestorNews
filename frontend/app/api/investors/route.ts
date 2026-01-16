import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'investor_news.db');

export async function GET(request: NextRequest) {
    try {
        const db = new Database(DB_PATH, { readonly: true });

        // Fetch investors
        // Order by ID or explicit order
        const stmt = db.prepare(`
            SELECT id, name, style_description, image_url, aliases 
            FROM investors 
            ORDER BY id ASC
        `);

        const investors = stmt.all();

        return NextResponse.json({ investors });

    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch investors' }, { status: 500 });
    }
}
