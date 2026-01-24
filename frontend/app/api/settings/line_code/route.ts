import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '../../../../lib/db';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Check if user exists
        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Generate 6 digit numeric code for ease of typing
        // or short alphanumeric
        const code = crypto.randomInt(100000, 999999).toString();

        const stmt = db.prepare('UPDATE users SET line_link_nonce = ? WHERE id = ?');
        stmt.run(code, userId);

        return NextResponse.json({ success: true, code });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
