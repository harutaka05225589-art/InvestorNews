import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { account_id, email, nickname, password } = body;

        // Basic validation
        if (!account_id || !email || !nickname || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        // Check if exists
        const check = db.prepare('SELECT id FROM users WHERE account_id = ? OR email = ?').get(account_id, email);
        if (check) {
            return NextResponse.json({ error: 'Account ID or Email already exists' }, { status: 409 });
        }

        // Hash & Insert
        const hashed = await hashPassword(password);
        const insert = db.prepare('INSERT INTO users (account_id, email, nickname, password_hash) VALUES (?, ?, ?, ?)');
        const result = insert.run(account_id, email, nickname, hashed);

        // Create Session
        await createSession(result.lastInsertRowid as number, nickname);

        return NextResponse.json({ success: true, nickname });
    } catch (error: any) {
        console.error("Signup error", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
