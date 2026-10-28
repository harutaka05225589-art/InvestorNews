import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Fail-closed guard for admin API endpoints.
 * Real password verification is performed by nginx HTTP Basic Auth (/etc/nginx/.htpasswd).
 * On Linux production, this additionally verifies that /etc/nginx/.htpasswd exists and an
 * Authorization: Basic header was forwarded, so admin endpoints stay locked even if code is
 * deployed before nginx Basic Auth is configured.
 */
export function verifyAdminBasicPassThrough(request: NextRequest): NextResponse | null {
    if (process.env.NODE_ENV !== 'production') {
        return null;
    }

    if (process.platform === 'linux' && !fs.existsSync('/etc/nginx/.htpasswd')) {
        return NextResponse.json(
            { error: 'Admin Basic Auth (/etc/nginx/.htpasswd) is not configured yet.' },
            { status: 503 }
        );
    }

    const auth = request.headers.get('authorization') || '';
    if (!auth.startsWith('Basic ')) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'WWW-Authenticate': 'Basic realm="Admin"',
            },
        });
    }

    return null;
}
