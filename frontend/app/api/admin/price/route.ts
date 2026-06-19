import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import Database from 'better-sqlite3';
import path from 'path';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DB_PATH = path.join(process.cwd(), 'investor_news.db');

async function checkAdmin() {
    const session = await getSession();
    const payload = session as { userId: string | number } | null;
    if (!payload || !payload.userId) return null;

    const db = new Database(DB_PATH, { readonly: true });
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(payload.userId) as { is_admin: number } | undefined;
    db.close();

    if (!user || user.is_admin !== 1) return null;
    return payload.userId;
}

export async function GET(request: NextRequest) {
    const adminId = await checkAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ticker = request.nextUrl.searchParams.get('ticker');
    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    try {
        const pythonCmd = `python3 -c "import yfinance as yf; info = yf.Ticker('${ticker}').info; print(info.get('currentPrice') or info.get('regularMarketPrice'))"`;
        const output = execSync(pythonCmd, { encoding: 'utf-8', timeout: 30000 });
        const price = parseFloat(output.trim());
        
        if (isNaN(price)) {
            return NextResponse.json({ error: 'Failed to parse price' }, { status: 500 });
        }
        
        return NextResponse.json({ price });
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to fetch price', detail: e.message }, { status: 500 });
    }
}
