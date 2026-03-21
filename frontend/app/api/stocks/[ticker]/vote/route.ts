import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { submitUserVote, getUserVote, getVoteStats } from '@/lib/db';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ ticker: string }> }
) {
    try {
        const session = await getSession();
        const userId = session?.id || session?.userId;
        
        if (!session || !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { vote, comment } = body; // 'bull' or 'bear', comment is optional

        if (vote !== 'bull' && vote !== 'bear') {
            return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
        }

        const { ticker } = await params;

        // Save vote and comment to DB
        submitUserVote(userId.toString(), ticker, vote, comment);

        // Return updated stats
        const updatedStats = getVoteStats(ticker);

        return NextResponse.json({ success: true, stats: updatedStats, comment });
    } catch (error) {
        console.error("Voting API error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
