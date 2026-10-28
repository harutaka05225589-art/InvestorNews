import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (Works per-instance/process)
const rateLimitMap = new Map();

function isRateLimited(ip: string, limit: number, windowMs: number) {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return false;
    }

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
        return false;
    }

    record.count += 1;
    return record.count > limit;
}

// Cleanup interval (every 10 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}, 600000);

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // 0. Disabled routes (account / personal-data features removed)
    const disabledPagePrefixes = ['/auth', '/portfolio', '/settings', '/alerts', '/plans'];
    if (disabledPagePrefixes.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        url.search = '';
        return NextResponse.redirect(url, 308);
    }

    const disabledApiPrefixes = ['/api/auth', '/api/portfolio', '/api/settings', '/api/alerts', '/api/notifications', '/api/line', '/api/og/portfolio'];
    if (disabledApiPrefixes.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        return new NextResponse(JSON.stringify({ error: 'Account system is disabled' }), {
            status: 410,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // 0b. Fail-closed check for Admin routes in production (nginx verifies the actual .htpasswd credentials)
    const isAdminRoute =
        pathname === '/admin' ||
        pathname.startsWith('/admin/') ||
        pathname === '/api/admin' ||
        pathname.startsWith('/api/admin/') ||
        ((pathname === '/api/investors' || pathname.startsWith('/api/investors/')) && request.method !== 'GET');

    if (isAdminRoute && process.env.NODE_ENV === 'production') {
        const auth = request.headers.get('authorization') || '';
        if (!auth.startsWith('Basic ')) {
            return new NextResponse('Authentication required', {
                status: 401,
                headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
            });
        }
    }

    const response = NextResponse.next();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // 1. Security Headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy
    const csp = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://fundingchoicesmessages.google.com https://ep2.adtrafficquality.google; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: https://ep2.adtrafficquality.google; frame-src 'self' https://googleads.g.doubleclick.net https://ep2.adtrafficquality.google https://www.google.com https://tpc.googlesyndication.com;";
    response.headers.set('Content-Security-Policy', csp);

    // 2. Rate Limiting (API Only)
    if (pathname.startsWith('/api/')) {
        const limit = 120; // 120 req/min
        const windowMs = 60 * 1000;

        if (isRateLimited(ip, limit, windowMs)) {
            return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
