
import { NextResponse } from 'next/server';
import { addPortfolioTransaction, getPortfolioTransactions, deletePortfolioTransaction, getLatestDividend } from '@/lib/db';
import { cookies } from 'next/headers';

import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = Number(session.userId);
        const transactions = getPortfolioTransactions(userId);

        // Enhance with Dividend Data
        const txWithDiv = transactions.map(tx => {
            const divInfo = getLatestDividend(tx.ticker);
            return {
                ...tx,
                latest_dividend: divInfo.amount,
                dividend_rights_month: divInfo.rightsMonth,
                dividend_payment_month: divInfo.paymentMonth,
                company_name: divInfo.companyName
            };
        });

        return NextResponse.json({ 
            transactions: txWithDiv,
            accountId: session.accountId 
        });
    } catch (error) {
        console.error("Portfolio GET Error:", error);
        return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = Number(session.userId);
        const body = await req.json();
        console.log("Portfolio POST Body:", body, "UserID:", userId);

        const { ticker, shares, price, date, accountType, type } = body;

        if (!ticker || shares === undefined || price === undefined) {
            console.error("Missing fields:", body);
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Handle Sell: specific logic or just negative shares?
        // We will store 'Sell' as negative shares in the DB to avoid schema migration
        const finalShares = type === 'sell' ? -1 * Math.abs(Number(shares)) : Math.abs(Number(shares));

        const result = addPortfolioTransaction(
            userId,
            ticker,
            finalShares,
            Number(price),
            date || null,
            accountType || 'general'
        );
        console.log(`Portfolio Add Success: ID=${result.lastInsertRowid}, Type=${type}, Shares=${finalShares}`);

        return NextResponse.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        console.error("Portfolio POST Error:", error);
        return NextResponse.json({ error: 'Failed to add transaction' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = Number(session.userId);
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
