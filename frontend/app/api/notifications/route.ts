import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const stmt = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20');
        const notifications = stmt.all(session.userId);

        // Count unread
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0');
        const unreadCount = (countStmt.get(session.userId) as { count: number }).count;

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Fetch notifications failed", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id } = body; // If ID provided, mark specific. If not, mark all.

        if (id) {
            db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, session.userId);
        } else {
            db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(session.userId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update notifications failed", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
