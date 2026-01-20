import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stmt = db.prepare(`
            SELECT * FROM edinet_documents 
            ORDER BY submitted_at DESC 
            LIMIT 5
        `);
        const docs = stmt.all();

        return NextResponse.json({ documents: docs });
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
}
