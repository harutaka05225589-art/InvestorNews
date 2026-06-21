import { NextRequest, NextResponse } from 'next/server';
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

// GET: List all watchlist items
export async function GET(request: NextRequest) {
    const adminId = await checkAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const db = new Database(DB_PATH, { readonly: true });
        const items = db.prepare(`
            SELECT * FROM admin_watchlist 
            ORDER BY 
                CASE WHEN buy_signal = '◎' THEN 0 ELSE 1 END,
                drop_pct ASC
        `).all();
        db.close();

        return NextResponse.json({ items });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Add new watchlist item
export async function POST(request: NextRequest) {
    const adminId = await checkAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, ticker, price_above, price_below, drop_threshold, per_limit,
            ath_drop_threshold, pbr_limit, dividend_yield_min,
            alert_yuutai_change, alert_earnings_date, alert_revision,
            volume_spike_ratio, alert_dilution } = body;

        if (!name || !ticker) {
            return NextResponse.json({ error: '銘柄名とティッカーは必須です' }, { status: 400 });
        }

        const db = new Database(DB_PATH);
        const stmt = db.prepare(`
            INSERT INTO admin_watchlist (name, ticker, price_above, price_below, drop_threshold, per_limit,
                ath_drop_threshold, pbr_limit, dividend_yield_min, alert_yuutai_change, alert_earnings_date,
                alert_revision, volume_spike_ratio, alert_dilution)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            name,
            ticker,
            price_above || null,
            price_below || null,
            drop_threshold ?? -20,
            per_limit ?? 15,
            ath_drop_threshold ?? null,
            pbr_limit ?? null,
            dividend_yield_min ?? null,
            alert_yuutai_change ?? 0,
            alert_earnings_date ?? 0,
            alert_revision ?? 0,
            volume_spike_ratio ?? null,
            alert_dilution ?? 0
        );
        db.close();

        return NextResponse.json({ id: result.lastInsertRowid, message: '追加しました' });
    } catch (error: any) {
        if (error.message?.includes('UNIQUE')) {
            return NextResponse.json({ error: 'この銘柄は既に登録されています' }, { status: 409 });
        }
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update watchlist item
export async function PUT(request: NextRequest) {
    const adminId = await checkAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, name, ticker, price_above, price_below, drop_threshold, per_limit, is_active,
            ath_drop_threshold, pbr_limit, dividend_yield_min,
            alert_yuutai_change, alert_earnings_date, alert_revision,
            volume_spike_ratio, alert_dilution } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const db = new Database(DB_PATH);
        db.prepare(`
            UPDATE admin_watchlist
            SET name = COALESCE(?, name),
                ticker = COALESCE(?, ticker),
                price_above = ?,
                price_below = ?,
                drop_threshold = COALESCE(?, drop_threshold),
                per_limit = COALESCE(?, per_limit),
                is_active = COALESCE(?, is_active),
                ath_drop_threshold = COALESCE(?, ath_drop_threshold),
                pbr_limit = COALESCE(?, pbr_limit),
                dividend_yield_min = COALESCE(?, dividend_yield_min),
                alert_yuutai_change = COALESCE(?, alert_yuutai_change),
                alert_earnings_date = COALESCE(?, alert_earnings_date),
                alert_revision = COALESCE(?, alert_revision),
                volume_spike_ratio = COALESCE(?, volume_spike_ratio),
                alert_dilution = COALESCE(?, alert_dilution)
            WHERE id = ?
        `).run(
            name || null,
            ticker || null,
            price_above ?? null,
            price_below ?? null,
            drop_threshold,
            per_limit,
            is_active,
            ath_drop_threshold ?? null,
            pbr_limit ?? null,
            dividend_yield_min ?? null,
            alert_yuutai_change ?? null,
            alert_earnings_date ?? null,
            alert_revision ?? null,
            volume_spike_ratio ?? null,
            alert_dilution ?? null,
            id
        );
        db.close();

        return NextResponse.json({ message: '更新しました' });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove watchlist item
export async function DELETE(request: NextRequest) {
    const adminId = await checkAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const db = new Database(DB_PATH);
        db.prepare('DELETE FROM admin_watchlist WHERE id = ?').run(id);
        db.close();

        return NextResponse.json({ message: '削除しました' });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
