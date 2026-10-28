import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { submitUserVote, getVoteStats } from '@/lib/db';

// Anonymous voting: no account / personal information.
// A random voter ID is stored in an httpOnly cookie to prevent double voting.
const VOTER_COOKIE = 'voter_id';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ ticker: string }> }
) {
    try {
        const body = await request.json();
        const { vote } = body; // 'bull' or 'bear'

        if (vote !== 'bull' && vote !== 'bear') {
            return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
        }

        const { ticker } = await params;

        const cookieStore = await cookies();
        let voterId = cookieStore.get(VOTER_COOKIE)?.value;
        const isValid = !!voterId && /^[0-9a-f-]{36}$/i.test(voterId);
        if (!isValid) {
            voterId = randomUUID();
        }

        // Save vote (no comment) to DB. Prefix to avoid collision with legacy numeric IDs.
        submitUserVote(`anon:${voterId}`, ticker.toUpperCase(), vote);

        const updatedStats = getVoteStats(ticker.toUpperCase());
        const res = NextResponse.json({ success: true, stats: updatedStats });

        if (!isValid) {
            res.cookies.set(VOTER_COOKIE, voterId!, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 365, // 1 year
                path: '/',
            });
        }
        return res;
    } catch (error) {
        console.error("Voting API error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
