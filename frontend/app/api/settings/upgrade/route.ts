import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { getSession, createSession } from '@/lib/auth';

const DB_PATH = path.join(process.cwd(), 'investor_news.db');

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Interface for DB Result
    interface InvitationCode {
        code: string;
        is_used: number; // SQLite uses 0/1
        used_by_user_id: number | null;
    }

    try {
        const { code } = await request.json();

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
        }

        const db = new Database(DB_PATH);

        // Check code
        const invite = db.prepare("SELECT * FROM invitation_codes WHERE code = ?").get(code.toUpperCase()) as InvitationCode | undefined;

        if (!invite) {
            return NextResponse.json({ error: '無効な招待コードです' }, { status: 400 });
        }

        if (invite.is_used) {
            return NextResponse.json({ error: 'このコードは既に使用されています' }, { status: 400 });
        }

        // Transaction
        const upgrade = db.transaction(() => {
            // Mark code as used
            db.prepare("UPDATE invitation_codes SET is_used = 1, used_by_user_id = ? WHERE code = ?").run(session.id, code.toUpperCase());

            // Upgrade user
            db.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").run(session.id);
        });

        upgrade();

        // Refresh Session with new Plan
        // session contains: id, userId, nickname, email, plan (old)
        // We reuse existing info but update plan
        await createSession(session.id as number, session.nickname as string, session.email as string, 'pro');

        return NextResponse.json({ success: true, message: 'Proプランにアップグレードされました！' });

    } catch (error) {
        console.error('Upgrade Error:', error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
