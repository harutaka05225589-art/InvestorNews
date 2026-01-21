import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Dynamic params
        const title = searchParams.get('title') || '注目投資家の動向';
        const subtitle = searchParams.get('subtitle') || '億り人の保有銘柄・決算速報サイト';

        // You can load custom fonts here if needed
        // const fontData = await fetch(new URL('../../assets/fonts/NotoSansJP-Bold.otf', import.meta.url)).then((res) => res.arrayBuffer());

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
                        backgroundColor: '#0f172a', /* dark background */
                        backgroundImage: 'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
                        backgroundSize: '100px 100px',
                        color: '#f8fafc',
                        fontFamily: 'sans-serif',
                    }}
                >
                    {/* Logo / Brand */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '20px',
                        padding: '10px 20px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        borderRadius: '50px',
                        border: '1px solid #3b82f6',
                        color: '#60a5fa',
                        fontWeight: 'bold',
                        fontSize: '24px'
                    }}>
                        億り人・決算速報
                    </div>

                    {/* Main Title */}
                    <div
                        style={{
                            fontSize: 60,
                            fontWeight: 900,
                            textAlign: 'center',
                            lineHeight: 1.2,
                            marginBottom: '20px',
                            padding: '0 40px',
                            textShadow: '0 4px 8px rgba(0,0,0,0.5)',
                            background: 'linear-gradient(to bottom, #ffffff, #94a3b8)',
                            backgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        {title}
                    </div>

                    {/* Subtitle */}
                    <div
                        style={{
                            fontSize: 30,
                            color: '#94a3b8',
                            textAlign: 'center',
                            maxWidth: '80%',
                        }}
                    >
                        {subtitle}
                    </div>
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
