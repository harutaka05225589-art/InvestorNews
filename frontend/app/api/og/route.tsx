import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Font loader helper with timeout and fallback
async function loadGoogleFont(text: string) {
    try {
        const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // Strict 1.5s timeout for Twitter Bot

        const cssRes = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const css = await cssRes.text();

        const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);

        if (resource) {
            const res = await fetch(resource[1]);
            return await res.arrayBuffer();
        }
    } catch (e) {
        console.error('Font load failed:', e);
    }
    return null;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Dynamic params
        let title = (searchParams.get('title') || 'Investor News').slice(0, 100); // Limit length
        let subtitle = (searchParams.get('subtitle') || '億り人の動向・決算速報').slice(0, 100);
        const type = searchParams.get('type') || 'default'; // default, alert, profile, investors

        if (type === 'investors') {
            title = '著名投資家一覧';
            subtitle = '大口投資家の最新ポートフォリオや動向をチェック';
        }

        // Load Font (Subsetted)
        const fontData = await loadGoogleFont(title + subtitle + "Invester News");

        const imageOptions: any = {
            width: 1200,
            height: 630,
        };

        if (fontData) {
            imageOptions.fonts = [
                {
                    name: 'Noto Sans JP',
                    data: fontData,
                    style: 'normal',
                    weight: 700,
                },
            ];
        }

        const imageRes = new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        fontFamily: fontData ? '"Noto Sans JP", sans-serif' : 'sans-serif',
                        position: 'relative',
                        padding: '60px',
                    }}
                >
                    {/* Content Container */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(30, 41, 59, 0.8)',
                        borderRadius: '24px',
                        border: '2px solid rgba(59, 130, 246, 0.4)',
                        padding: '40px'
                    }}>
                        {/* Brand Badge */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '40px',
                            padding: '12px 32px',
                            backgroundColor: '#1e293b',
                            borderRadius: '100px',
                            border: '1px solid #3b82f6',
                            color: '#60a5fa',
                            fontWeight: 'bold',
                            fontSize: '28px',
                        }}>
                            <span style={{ marginRight: '12px' }}>📊</span> Invester News
                        </div>

                        {/* Main Title */}
                        <div
                            style={{
                                display: 'flex',
                                fontSize: title.length > 20 ? 56 : 72,
                                fontWeight: 900,
                                marginBottom: '24px',
                                color: '#ffffff',
                                textAlign: 'center',
                            }}
                        >
                            {title}
                        </div>

                        {/* Subtitle */}
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 32,
                                color: '#94a3b8',
                                marginTop: '20px',
                                borderTop: '2px solid rgba(148, 163, 184, 0.2)',
                                paddingTop: '32px',
                                textAlign: 'center',
                            }}
                        >
                            {subtitle}
                        </div>
                    </div>

                    {/* Bottom Accents */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '12px',
                        backgroundColor: '#3b82f6',
                    }} />
                </div>
            ),
            imageOptions
        );

        // Ensure we fully compute the image and pass explicit Content-Length instead of chunked streaming
        // Twitterbot silently rejects Transfer-Encoding: chunked for images.
        const arrayBuffer = await imageRes.arrayBuffer();
        return new Response(arrayBuffer, {
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': arrayBuffer.byteLength.toString(),
                'Cache-Control': 'public, max-age=31536000, immutable',
            }
        });
    } catch (e: any) {
        console.log(`${e.message}`);
        // Fallback or Error Image could be returned here if needed
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
