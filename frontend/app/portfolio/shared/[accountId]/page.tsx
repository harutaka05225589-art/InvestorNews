import { getUserByAccountId, getSharedPortfolioData } from '@/lib/db';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ accountId: string }> }): Promise<Metadata> {
    const { accountId } = await params;
    const user = getUserByAccountId(accountId);
    if (!user) return { title: 'Not Found' };

    const { totalInvested, totalNetDividend } = getSharedPortfolioData(user.id);
    const yieldValue = totalInvested > 0 ? ((totalNetDividend / totalInvested) * 100).toFixed(2) : '0.00';
    
    return {
        title: `${user.nickname}の配当ポートフォリオ｜億り人・決算速報`,
        description: `${user.nickname}さんの日本株ポートフォリオ。年間予想配当金 ${Math.round(totalNetDividend).toLocaleString()}円、利回り ${yieldValue}%。`,
        openGraph: {
            images: [`https://rich-investor-news.com/api/og/portfolio?name=${encodeURIComponent(user.nickname)}&yield=${yieldValue}&div=${Math.round(totalNetDividend)}`],
        },
        twitter: {
            card: 'summary_large_image',
            images: [`https://rich-investor-news.com/api/og/portfolio?name=${encodeURIComponent(user.nickname)}&yield=${yieldValue}&div=${Math.round(totalNetDividend)}`],
        }
    };
}

import SharedPortfolioCharts from '@/components/SharedPortfolioCharts';

export default async function SharedPortfolioPage({ params }: { params: Promise<{ accountId: string }> }) {
    const { accountId } = await params;
    const user = getUserByAccountId(accountId);
    
    if (!user) {
        notFound();
    }

    const { holdings, totalInvested, totalNetDividend } = getSharedPortfolioData(user.id);
    const yieldValue = totalInvested > 0 ? ((totalNetDividend / totalInvested) * 100).toFixed(2) : '0.00';
    
    // Sort by largest holding weight
    const sortedHoldings = holdings.sort((a, b) => b.invested - a.invested);

    return (
        <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '16px', padding: '3rem', border: '1px solid #334155', textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f8fafc', marginBottom: '1rem' }}>
                    {user.nickname}の配当ポートフォリオ
                </h1>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '0.5rem' }}>ポートフォリオ利回り</div>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#38bdf8' }}>{yieldValue}<span style={{ fontSize: '1.5rem', marginLeft: '4px' }}>%</span></div>
                    </div>
                    <div>
                        <div style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '0.5rem' }}>年間予想配当金 (税引後)</div>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#4ade80' }}>{Math.round(totalNetDividend).toLocaleString()}<span style={{ fontSize: '1.5rem', marginLeft: '4px' }}>円</span></div>
                    </div>
                </div>
                
                <div style={{ marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid #334155' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                        このポートフォリオの最新情報と、あなた自身の配当管理を始めるなら「億り人・決算速報」へ
                    </p>
                    <Link href="/portfolio" style={{ display: 'inline-block', padding: '1rem 3rem', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', borderRadius: '30px', textDecoration: 'none', fontSize: '1.2rem', transition: 'opacity 0.2s' }} className="hover:opacity-90">
                        無料でポートフォリオを作成する &rarr;
                    </Link>
                </div>
            </div>

            <SharedPortfolioCharts holdings={holdings} />

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', borderBottom: '2px solid #334155', paddingBottom: '0.5rem' }}>
                保有銘柄トップ ({sortedHoldings.length}銘柄)
            </h2>
            
            <div style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '8px', padding: '1rem', border: '1px solid #334155' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>銘柄</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>保有元本比率</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>年間配当 (概算)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedHoldings.map((h, i) => (
                            <tr key={`${h.ticker}-${h.accountType}`} style={{ borderBottom: '1px solid #334155' }}>
                                <td style={{ padding: '1rem' }}>
                                    <Link href={`/stocks/${h.ticker}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '1.1rem' }}>{h.ticker}</span>
                                        <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{h.name}</span>
                                    </Link>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: '#f1f5f9', fontSize: '1.1rem' }}>
                                    {totalInvested > 0 ? ((h.invested / totalInvested) * 100).toFixed(1) : 0}%
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: '#4ade80', fontSize: '1.1rem' }}>
                                    {Math.round(h.netDividend).toLocaleString()}円
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
