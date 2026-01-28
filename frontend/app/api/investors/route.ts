import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'investor_news.db');

export async function GET(request: NextRequest) {
    try {
        const db = new Database(DB_PATH, { readonly: true });

        // Fetch investors
        // Order by ID or explicit order
        const stmt = db.prepare(`
            SELECT id, name, style_description, image_url, aliases 
            FROM investors 
            ORDER BY id ASC
        `);

        const investors = stmt.all();

        return NextResponse.json({ investors });

    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch investors' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, style_description, image_url, twitter_url, aliases } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const db = new Database(DB_PATH);
        const stmt = db.prepare(`
            INSERT INTO investors (name, style_description, image_url, twitter_url, aliases)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(name, style_description || '', image_url || '', twitter_url || '', aliases || '[]');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to create investor' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const session = await getSession();
    if (!session || !session.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, name, style_description, image_url, twitter_url, aliases } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const db = new Database(DB_PATH);
        const stmt = db.prepare(`
            UPDATE investors 
            SET name = ?, style_description = ?, image_url = ?, twitter_url = ?, aliases = ?
            WHERE id = ?
        `);

        const result = stmt.run(name, style_description || '', image_url || '', twitter_url || '', aliases || '[]', id);

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to update investor' }, { status: 500 });
    }
}
