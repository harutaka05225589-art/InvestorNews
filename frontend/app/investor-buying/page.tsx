import { getInvestorBuyingRanking } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: '著名投資家の買い増し銘柄一覧｜日本株投資家動向',
        description: '著名投資家が買い増しした日本株銘柄を一覧表示。最新の保有比率、投資家名、銘柄情報を簡単に確認できます。億り人の動向を追って投資戦略を練りましょう。',
    };
}

export default async function InvestorBuyingPage() {
    const list = await getInvestorBuyingRanking(50);
    const BASE_URL = 'https://rich-investor-news.com';

    // Structured Data: Breadcrumb & Article
    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": BASE_URL },
                { "@type": "ListItem", "position": 2, "name": "著名投資家の買い増し銘柄", "item": `${BASE_URL}/investor-buying` }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "著名投資家の買い増し銘柄一覧｜日本株投資家動向",
            "description": "日本株市場で注目される著名投資家の最新の買い増し・保有増加銘柄を一覧で紹介します。投資家のポートフォリオ動向をチェック。",
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

            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', borderBottom: '3px solid #ec4899', paddingBottom: '0.5rem' }}>
                著名投資家の買い増し銘柄一覧
            </h1>

            <div style={{ background: 'rgba(236, 72, 153, 0.1)', border: '1px solid #ec4899', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                このページでは、著名投資家のポートフォリオで保有比率が増加した銘柄、または最新の大量保有分を一覧表示しています。
                「億り人」と呼ばれる成功した投資家がどの銘柄を、どのタイミングで購入しているかを知ることは、自身の投資手法を磨く上で非常に有効です。
            </div>

            <div style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '0.9rem' }}>
                            <th style={{ padding: '1rem' }}>投資家名</th>
                            <th style={{ padding: '1rem' }}>銘柄名 (コード)</th>
                            <th style={{ padding: '1rem' }}>保有比率</th>
                            <th style={{ padding: '1rem' }}>データ確認日</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((item: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }} className="hover:bg-slate-800/50">
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ color: '#ec4899', fontWeight: 'bold' }}>
                                        {item.shareholder_name}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <Link href={`/stocks/${item.ticker}`} style={{ color: '#60a5fa', fontWeight: 'bold', textDecoration: 'none' }}>
                                        {item.company_name || '銘柄詳細'}
                                    </Link>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem' }}>({item.ticker})</span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                        {item.share_ratio}%
                                    </span>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>主保有: 第{item.rank}位</div>
                                </td>
                                <td style={{ padding: '1rem', color: '#94a3b8' }}>
                                    {item.entry_date}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', color: '#94a3b8', fontSize: '0.9rem' }}>
                <h3 style={{ color: '#f8fafc', marginBottom: '1rem' }}>🔍 著名投資家の動向を追う際の注意点</h3>
                <p style={{ lineHeight: '1.8' }}>
                    本データは有価証券報告書等に基づいた大量保有報告や株主名簿の情報を自動集計しています。
                    投資家のポジションには数ヶ月のタイムラグがある場合があり、すでに一部を売却している可能性も考慮する必要があります。
                    <strong>著名投資家の買いはあくまで「参考情報のひとつ」とし、自分自身の分析と組み合わせて最終的な投資判断を行ってください。</strong>
                </p>
                <div style={{ marginTop: '1rem' }}>
                    <Link href="/introduction" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 'bold' }}>&rarr; 著名投資家の一覧とプロフィールを詳しく見る</Link>
                </div>
            </div>
        </div>
    );
}
