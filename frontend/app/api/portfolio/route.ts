
import { NextResponse } from 'next/server';
import { addPortfolioTransaction, getPortfolioTransactions, deletePortfolioTransaction, getLatestDividend } from '@/lib/db';
import { cookies } from 'next/headers';

// Mock User ID retrieval (Replace with actual auth logic if available)
// For now, assuming we use the 'userId' cookie or a default test user
async function getUserId(req: Request): Promise<number> {
    // Check header or cookie
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('userId');
    if (userIdCookie) {
        return parseInt(userIdCookie.value, 10);
    }
    // Default fallback for dev/demo if no auth implemented yet
    return 1;
}

export async function GET(req: Request) {
    try {
        const userId = await getUserId(req);
        const transactions = getPortfolioTransactions(userId);

        // Enhance with Dividend Data
        const txWithDiv = transactions.map(tx => {
            const div = getLatestDividend(tx.ticker);
            return { ...tx, latest_dividend: div };
        });

        return NextResponse.json({ transactions: txWithDiv });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserId(req);
        const body = await req.json();
        const { ticker, shares, price, date, accountType } = body;

        if (!ticker || shares === undefined || price === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = addPortfolioTransaction(
            userId,
            ticker,
            Number(shares),
            Number(price),
            date || null,
            accountType || 'general'
        );

        return NextResponse.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to add transaction' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const userId = await getUserId(req);
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        deletePortfolioTransaction(Number(id), userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }
}
