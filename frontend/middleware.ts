import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (Works per-instance/process)
// Map<IP, { count: number, resetTime: number }>
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
    const response = NextResponse.next();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // 1. Security Headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN'); // Allow embedding only on same origin
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy (Allow inline styles for now as we use them heavily)
    const csp = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://fundingchoicesmessages.google.com https://ep2.adtrafficquality.google; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: https://ep2.adtrafficquality.google; frame-src 'self' https://googleads.g.doubleclick.net https://ep2.adtrafficquality.google https://www.google.com https://tpc.googlesyndication.com;";
    response.headers.set('Content-Security-Policy', csp);

    // 2. Rate Limiting (API Only)
    if (request.nextUrl.pathname.startsWith('/api/')) {
        let limit = 120; // Default: 120 req/min
        const windowMs = 60 * 1000;

        // Stricter limit for Auth
        if (request.nextUrl.pathname.startsWith('/api/auth/')) {
            limit = 20; // 20 req/min for login/signup
        }

        if (isRateLimited(ip, limit, windowMs)) {
            return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // 3. Auth Protection (Middleware layer)
    // Basic check: if session cookie is missing, redirect key pages to login.
    const protectedPaths = ['/portfolio', '/settings', '/admin'];
    if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
        const session = request.cookies.get('session');
        if (!session) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth/login';
            url.searchParams.set('callbackUrl', request.nextUrl.pathname); // Friendly redirect
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
