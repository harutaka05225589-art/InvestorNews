import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession, logout } from '@/lib/auth';

export async function DELETE() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Transaction to delete everything related to the user
        const deleteUser = db.transaction(() => {
            // 1. Delete Alerts
            db.prepare('DELETE FROM alerts WHERE user_id = ?').run(session.userId);

            // 2. Delete Notifications (if table exists, future proofing)
            try {
                db.prepare('DELETE FROM notifications WHERE user_id = ?').run(session.userId);
            } catch (e) {
                // Table might not exist yet, ignore
            }

            // 3. Delete User
            db.prepare('DELETE FROM users WHERE id = ?').run(session.userId);
        });

        deleteUser();

        // 4. Clear Session
        await logout();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete account failed", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
