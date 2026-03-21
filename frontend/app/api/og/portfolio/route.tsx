import { ImageResponse } from 'next/og';
// @ts-ignore
import React from 'react'; // Next.js 14+ specific workaround for react

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Extract query parameters
        const nickname = searchParams.get('name') || '著名投資家';
        const rawYield = searchParams.get('yield') || '0';
        const rawDiv = searchParams.get('div') || '0';
        
        // Format them cleanly
        const yieldValue = parseFloat(rawYield).toFixed(2);
        const dividendValue = parseInt(rawDiv, 10).toLocaleString();

        // High quality design utilizing gradients and glassmorphism aspects
        return new ImageResponse(
            (
                <div
                    style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: '"Inter", sans-serif',
                        padding: '40px',
                        color: 'white',
                    }}
                >
                    {/* Background Pattern */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                    {/* Logo/Site Area */}
                    <div style={{ position: 'absolute', top: '40px', left: '50px', display: 'flex', alignItems: 'center' }}>
                        <div style={{ background: '#38bdf8', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '24px', color: '#0f172a' }}>
                            億り人・決算速報
                        </div>
                    </div>

                    {/* Main Content Card Container */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '2px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '24px',
                            padding: '60px 80px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            marginTop: '40px'
                        }}
                    >
                        {/* Title Section */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '42px', fontWeight: 'bold' }}>{nickname}の配当ポートフォリオ</span>
                        </div>

                        {/* Metric Row */}
                        <div style={{ display: 'flex', gap: '60px', marginTop: '40px' }}>
                            {/* Metric 1 */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(15, 23, 42, 0.5)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                                <span style={{ color: '#94a3b8', fontSize: '24px', marginBottom: '10px' }}>ポートフォリオ利回り</span>
                                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                    <span style={{ fontSize: '64px', fontWeight: 'bold', color: '#38bdf8' }}>{yieldValue}</span>
                                    <span style={{ fontSize: '32px', color: '#38bdf8', marginLeft: '5px' }}>%</span>
                                </div>
                            </div>

                            {/* Metric 2 */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(15, 23, 42, 0.5)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                                <span style={{ color: '#94a3b8', fontSize: '24px', marginBottom: '10px' }}>年間予想配当金 (税引前)</span>
                                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                    <span style={{ fontSize: '64px', fontWeight: 'bold', color: '#4ade80' }}>{dividendValue}</span>
                                    <span style={{ fontSize: '32px', color: '#4ade80', marginLeft: '5px' }}>円</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        console.error("OG Image generation failed", e);
        return new Response('Failed to generate image', { status: 500 });
    }
}
