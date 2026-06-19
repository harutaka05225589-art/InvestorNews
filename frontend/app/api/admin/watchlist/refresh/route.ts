import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { getSession } from '@/lib/auth';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'investor_news.db');

async function checkAdmin() {
    const session = await getSession();
    const payload = session as { userId: string | number } | null;
    if (!payload || !payload.userId) return null;

    const db = new Database(DB_PATH, { readonly: true });
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(payload.userId) as { is_admin: number } | undefined;
    db.close();

    if (!user || user.is_admin !== 1) return null;
    return payload.userId;
}

// POST: Trigger manual price refresh
export async function POST(request: NextRequest) {
    const adminId = await checkAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Execute the Python checker in refresh-only mode (no alerts)
        const pythonCmd = `cd ../backend && python3 check_admin_watchlist.py --refresh`;
        
        console.log(`[Admin Watchlist] Running: ${pythonCmd}`);
        
        const output = execSync(pythonCmd, {
            cwd: process.cwd(),
            timeout: 120000, // 2 min timeout
            encoding: 'utf-8',
        });

        console.log(`[Admin Watchlist] Output:\n${output}`);

        // Return updated data from DB
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
            log: output.slice(-500) // Last 500 chars of output
        });
    } catch (error: any) {
        console.error('[Admin Watchlist] Refresh error:', error);
        return NextResponse.json({ 
            error: '株価の取得に失敗しました',
            detail: error.message 
        }, { status: 500 });
    }
}
