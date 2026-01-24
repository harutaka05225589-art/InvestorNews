import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// DB Path
const DB_PATH = path.join(process.cwd(), 'investor_news.db');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, ...settings } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const db = new Database(DB_PATH);

        // Dynamic update based on provided fields
        const fields = [];
        const values = [];

        if (settings.emailNotifications !== undefined) {
            fields.push('email_notifications = ?');
            values.push(settings.emailNotifications ? 1 : 0);
        }
        if (settings.notifyRevisions !== undefined) {
            fields.push('notify_revisions = ?');
            values.push(settings.notifyRevisions ? 1 : 0);
        }
        if (settings.notifyEarnings !== undefined) {
            fields.push('notify_earnings = ?');
            values.push(settings.notifyEarnings ? 1 : 0);
        }
        if (settings.notifyPrice !== undefined) {
            fields.push('notify_price = ?');
            values.push(settings.notifyPrice ? 1 : 0);
        }

        if (fields.length > 0) {
            values.push(userId);
            const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            db.prepare(sql).run(...values);
        }

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error('Settings Update Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    try {
        const db = new Database(DB_PATH, { readonly: true });
        // Select all notification cols
        const user = db.prepare('SELECT email_notifications, notify_revisions, notify_earnings, notify_price FROM users WHERE id = ?').get(userId) as any;

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({
            success: true,
            emailNotifications: user.email_notifications,
            notifyRevisions: user.notify_revisions,
            notifyEarnings: user.notify_earnings,
            notifyPrice: user.notify_price
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
