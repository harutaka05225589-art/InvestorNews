import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// DB Path
const DB_PATH = path.join(process.cwd(), 'investor_news.db');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, emailNotifications } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const db = new Database(DB_PATH);

        // Update setting
        const stmt = db.prepare('UPDATE users SET email_notifications = ? WHERE id = ?');
        stmt.run(emailNotifications ? 1 : 0, userId);

        return NextResponse.json({ success: true, emailNotifications });
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
        const user = db.prepare('SELECT email_notifications FROM users WHERE id = ?').get(userId) as any;

        return NextResponse.json({ success: true, emailNotifications: user ? user.email_notifications : 0 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
