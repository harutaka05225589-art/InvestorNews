import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Join with ir_events (or just fetch names? ir_events might have duplicates)
        // Better: Subquery or just basic select and let frontend handle? 
        // User asked for company name. IR events is the source.
        // We can do a subquery.
        const stmt = db.prepare(`
            SELECT a.*, 
            (SELECT company_name FROM ir_events WHERE ticker = a.ticker LIMIT 1) as company_name
            FROM alerts a 
            WHERE a.user_id = ? 
            ORDER BY a.id DESC
        `);
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
        // target_per and condition can now be null/undefined
        const { ticker, target_per, condition, memo } = body;

        if (!ticker) {
            return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
        }

        const stmt = db.prepare(`
            INSERT INTO alerts (user_id, ticker, target_per, condition, memo) 
            VALUES (?, ?, ?, ?, ?)
        `);
        // If target_per is empty string or null, save as null
        const val_per = (target_per === '' || target_per === null) ? null : target_per;
        const val_cond = (condition === '' || condition === null) ? null : condition;
        const val_memo = memo || '';

        const info = stmt.run(session.userId, ticker, val_per, val_cond, val_memo);

        return NextResponse.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        console.error("Create alert failed", error);
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
        const { id, memo } = body;

        const stmt = db.prepare('UPDATE alerts SET memo = ? WHERE id = ? AND user_id = ?');
        const info = stmt.run(memo || '', id, session.userId);

        if (info.changes === 0) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update alert failed", error);
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
