import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'investor_news.db');

// Protected by nginx HTTP Basic Auth on the production server.
export async function POST(_request: NextRequest) {
    try {
        const pythonCmd = `cd ../backend && python3 check_admin_watchlist.py --refresh`;

        console.log(`[Admin Watchlist] Running: ${pythonCmd}`);

        const output = execSync(pythonCmd, {
            cwd: process.cwd(),
            timeout: 120000,
            encoding: 'utf-8',
        });

        console.log(`[Admin Watchlist] Output:\n${output}`);

        const db = new Database(DB_PATH, { readonly: true });
        const items = db.prepare(`
            SELECT * FROM admin_watchlist
            ORDER BY 
                CASE WHEN buy_signal = '◎' THEN 0 ELSE 1 END,
                drop_pct ASC
        `).all();
        db.close();

        return NextResponse.json({
            message: '株価を更新しました',
            items,
            log: output.slice(-500)
        });
    } catch (error: any) {
        console.error('[Admin Watchlist] Refresh error:', error);
        return NextResponse.json({
            error: '株価の取得に失敗しました',
            detail: error.message
        }, { status: 500 });
    }
}
