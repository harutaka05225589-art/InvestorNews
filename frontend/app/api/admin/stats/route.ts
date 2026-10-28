import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { verifyAdminBasicPassThrough } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'investor_news.db');

// Protected by nginx HTTP Basic Auth on the production server.
export async function GET(request: NextRequest) {
    const blocked = verifyAdminBasicPassThrough(request);
    if (blocked) return blocked;
    try {
        const db = new Database(DB_PATH, { readonly: true });

        const safeCount = (table: string) => {
            try {
                const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
                return row?.count ?? 0;
            } catch {
                return 0;
            }
        };

        const stats = {
            totalRevisions: safeCount('revisions'),
            totalCompanies: safeCount('companies'),
            totalVotes: safeCount('user_votes'),
            watchlistCount: safeCount('admin_watchlist'),
        };
        db.close();

        return NextResponse.json({ stats, recentUsers: [] });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
