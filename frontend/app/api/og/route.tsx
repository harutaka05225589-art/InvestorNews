import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Dynamic params
        const title = searchParams.get('title') || 'Investor News';
        const subtitle = searchParams.get('subtitle') || '億り人のポートフォリオ・決算速報';
        const type = searchParams.get('type') || 'default'; // default, alert, profile

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0f172a', // Slate-900
                        backgroundImage: `
                            linear-gradient(to bottom right, #0f172a, #1e293b),
                            radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 20%),
                            radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 20%)
                        `,
                        color: '#f8fafc',
                        fontFamily: '"Noto Sans JP", sans-serif',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Background Grid Pattern */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
                        zIndex: 0,
                    }} />

                    {/* Content Container */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 10,
                        padding: '0 60px',
                        textAlign: 'center',
                    }}>
                        {/* Brand Badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '30px',
                            padding: '8px 24px',
                            background: 'linear-gradient(90deg, #1e293b, #334155)',
                            borderRadius: '100px',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#60a5fa',
                            fontWeight: 'bold',
                            fontSize: '24px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        }}>
                            <span style={{ marginRight: '8px' }}>📊</span> Invester News
                        </div>

                        {/* Main Title */}
                        <div
                            style={{
                                fontSize: title.length > 20 ? 56 : 72, // Auto-size
                                fontWeight: 900,
                                lineHeight: 1.1,
                                marginBottom: '24px',
                                textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                background: 'linear-gradient(to bottom, #ffffff, #cbd5e1)',
                                backgroundClip: 'text',
                                color: 'transparent',
                                letterSpacing: '-0.02em',
                                maxWidth: '1100px',
                                wordBreak: 'keep-all', // Japanese line breaking
                            }}
                        >
                            {title}
                        </div>

                        {/* Subtitle */}
                        <div
                            style={{
                                fontSize: 32,
                                color: '#94a3b8',
                                maxWidth: '900px',
                                lineHeight: 1.4,
                                borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                                paddingTop: '24px',
                            }}
                        >
                            {subtitle}
                        </div>
                    </div>

                    {/* Bottom Accents */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        height: '8px',
                        background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981)',
                        zIndex: 20,
                    }} />
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
