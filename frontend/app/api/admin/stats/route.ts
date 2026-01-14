
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'investor_news.db');

export async function GET(request: NextRequest) {
    // 1. Check Authentication & Admin Status
    const session = await getSession();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = new Database(DB_PATH, { readonly: true });

        // Convert session user id to number or string depending on DB
        // Assuming session.user.userId matches account_id or db id. 
        // Let's check `is_admin` column from `users` table via DB lookup to be safe.
        // Actually `session.user` might not have `is_admin` yet unless we update the session structure.
        // For now, let's query the DB for the user's admin status.

        // Wait, session might not have the DB ID if it uses account_id.
        // Let's assume session.user.userId is the account_id.
        const user = db.prepare('SELECT is_admin FROM users WHERE account_id = ?').get(session.user.userId) as { is_admin: number };

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
