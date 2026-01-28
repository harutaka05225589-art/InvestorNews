import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'investor_news.db');

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { investor_id, title, url, summary, published_at } = body;

        if (!investor_id || !title || !url) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = new Database(DB_PATH);
        const stmt = db.prepare(`
            INSERT INTO news_items (investor_id, title, url, summary, published_at)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(investor_id, title, url, summary || '', published_at || new Date().toISOString());

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Database Error:', error);
        // Handle unique constraint violation for URL
        if (String(error).includes('UNIQUE constraint failed')) {
            return NextResponse.json({ error: 'News with this URL already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create news item' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const db = new Database(DB_PATH);
        const stmt = db.prepare('DELETE FROM news_items WHERE id = ?');
        const result = stmt.run(id);

        if (result.changes === 0) {
            return NextResponse.json({ error: 'News item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to delete news item' }, { status: 500 });
    }
}
