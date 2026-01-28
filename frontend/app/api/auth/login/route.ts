import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { identifier, password } = body; // identifier = email OR account_id

        if (!identifier || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        // Find user
        const stmt = db.prepare('SELECT * FROM users WHERE account_id = ? OR email = ?');
        const user = stmt.get(identifier, identifier) as any;

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create Session
        await createSession(user.id, user.nickname, user.email, user.plan, !!user.is_admin);

        return NextResponse.json({ success: true, nickname: user.nickname });
    } catch (error) {
        console.error("Login error", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
