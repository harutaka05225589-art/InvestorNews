import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { verifyAdminBasicPassThrough } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// Protected by nginx HTTP Basic Auth on the production server.
export async function GET(request: NextRequest) {
    const blocked = verifyAdminBasicPassThrough(request);
    if (blocked) return blocked;
    const ticker = request.nextUrl.searchParams.get('ticker');
    if (!ticker || !/^[0-9A-Z.]{1,10}$/i.test(ticker)) {
        return NextResponse.json({ error: 'Valid ticker is required' }, { status: 400 });
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
        const stderr = e.stderr ? e.stderr.toString('utf-8') : '';
        const stdout = e.stdout ? e.stdout.toString('utf-8') : '';
        return NextResponse.json({
            error: `Failed to fetch price: ${e.message}`,
            detail: stderr || stdout || e.toString()
        }, { status: 500 });
    }
}
