import { getRevisionRateFullRanking } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: '業績修正率ランキング｜大幅上方修正銘柄一覧',
        description: '日本株の業績修正銘柄を修正率ランキング形式で紹介。大幅上方修正銘柄を一覧で確認できます。TDnet開示情報をもとに、修正率の高い企業をAIが詳しく解析。',
    };
}

export default async function RevisionRateRankingPage() {
    const rankings = await getRevisionRateFullRanking(100);
    const BASE_URL = 'https://rich-investor-news.com';

    // Structured Data: Breadcrumb & Article
    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": BASE_URL },
                { "@type": "ListItem", "position": 2, "name": "業績修正率ランキング", "item": `${BASE_URL}/revision-rate-ranking` }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "業績修正率ランキング｜大幅上方修正・下方修正銘柄一覧",
            "description": "このページでは、日本株の業績修正銘柄を修正率ランキング形式で紹介します。TDnet開示情報をもとに、修正率の高い企業を一覧表示しています。",
            "image": `${BASE_URL}/og-image.png`,
            "author": { "@type": "Organization", "name": "億り人・決算速報 (RIN)" },
            "publisher": { "@type": "Organization", "name": "億り人・決算速報 (RIN)" },
            "datePublished": new Date().toISOString()
        }
    ];

    return (
        <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', borderBottom: '3px solid #6366f1', paddingBottom: '0.5rem' }}>
                業績修正率ランキング｜大幅上方修正銘柄一覧
            </h1>

            <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid #6366f1', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                このページでは、日本株の業績修正銘柄を修正率ランキング形式で紹介します。
                TDnet開示情報をもとに、修正率（営業利益）の絶対値が大きい順に一覧表示しています。
                大幅な上方修正はもちろん、リスク管理のための下方修正の確認にもお役立てください。
            </div>

            <div style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '0.9rem' }}>
                            <th style={{ padding: '1rem' }}>銘柄名 (コード)</th>
                            <th style={{ padding: '1rem' }}>修正率 (営業利益)</th>
                            <th style={{ padding: '1rem' }}>内容（上方/下方）</th>
                            <th style={{ padding: '1rem' }}>修正日</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((rev: any) => (
                            <tr key={rev.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }} className="hover:bg-slate-800/50">
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <Link href={`/stocks/${rev.ticker}`} style={{ color: '#60a5fa', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.1rem' }}>
                                            {rev.company_name}
                                        </Link>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>({rev.ticker})</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>{rev.sector} / {rev.market}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ color: rev.revision_rate_op > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        {rev.revision_rate_op > 0 ? '+' : ''}{rev.revision_rate_op}%
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <Link href={`/revisions/${rev.id}`} style={{ textDecoration: 'none' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                            <span style={{ 
                                                padding: '0.2rem 0.5rem', 
                                                borderRadius: '4px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 'bold',
                                                background: rev.is_upward ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                                color: rev.is_upward ? '#4ade80' : '#f87171',
                                                border: `1px solid ${rev.is_upward ? '#4ade80' : '#f87171'}`
                                            }}>
                                                {rev.is_upward ? '上方修正' : '下方修正'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {rev.ai_summary || rev.title}
                                        </div>
                                    </Link>
                                </td>
                                <td style={{ padding: '1rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                    {rev.revision_date}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link href="/upward-revision-stocks" style={{ padding: '0.75rem 1.5rem', background: '#38bdf8', color: '#fff', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold' }}>向上修正銘柄の一覧へ</Link>
                <Link href="/dividend-increase-stocks" style={{ padding: '0.75rem 1.5rem', background: '#fbbf24', color: '#000', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold' }}>増配銘柄の一覧へ</Link>
                <Link href="/share-buyback-stocks" style={{ padding: '0.75rem 1.5rem', background: '#a855f7', color: '#fff', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold' }}>自社株買い一覧へ</Link>
            </div>
        </div>
    );
}
