
import { NextResponse } from 'next/server';
import { searchCompanies } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 1) {
        return NextResponse.json({ results: [] });
    }

    try {
        const results = searchCompanies(q);
        return NextResponse.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

