import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const stmt = db.prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY id DESC');
        const alerts = stmt.all(session.userId);
        return NextResponse.json({ alerts });
    } catch (error) {
        console.error("Fetch alerts failed", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { ticker, target_per, condition } = body;

        if (!ticker || !target_per || !condition) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const stmt = db.prepare(`
            INSERT INTO alerts (user_id, ticker, target_per, condition) 
            VALUES (?, ?, ?, ?)
        `);
        const info = stmt.run(session.userId, ticker, target_per, condition);

        return NextResponse.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        console.error("Create alert failed", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id } = body;

        const stmt = db.prepare('DELETE FROM alerts WHERE id = ? AND user_id = ?');
        const info = stmt.run(id, session.userId);

        if (info.changes === 0) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete alert failed", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
