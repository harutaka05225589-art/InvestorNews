
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'investor_news.db');

export async function GET(request: NextRequest) {
    // 1. Check Authentication & Admin Status
    const session = await getSession();

    // Explicitly cast session to expected type for TS
    const payload = session as { userId: string | number; nickname: string } | null;

    if (!payload || !payload.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = new Database(DB_PATH, { readonly: true });

        // Retrieve userId from payload (it's directly in the session, not in session.user)
        const user = db.prepare('SELECT is_admin FROM users WHERE account_id = ?').get(payload.userId) as { is_admin: number };

        if (!user || user.is_admin !== 1) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Fetch Stats
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
        const alertCount = db.prepare('SELECT COUNT(*) as count FROM alerts').get() as { count: number };
        const activeAlertCount = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE is_active = 1').get() as { count: number };
        const notifCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get() as { count: number };

        // Fetch recent users (Limit 5)
        const recentUsers = db.prepare('SELECT nickname, email, created_at FROM users ORDER BY created_at DESC LIMIT 5').all();

        return NextResponse.json({
            stats: {
                totalUsers: userCount.count,
                totalAlerts: alertCount.count,
                activeAlerts: activeAlertCount.count,
                totalNotifications: notifCount.count
            },
            recentUsers
        });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
