import { NextResponse } from 'next/server';

// Account system removed for privacy protection. This endpoint is permanently disabled.
const gone = () => NextResponse.json({ error: 'This feature has been discontinued.' }, { status: 410 });

export const GET = gone;
export const POST = gone;
export const PUT = gone;
export const DELETE = gone;
