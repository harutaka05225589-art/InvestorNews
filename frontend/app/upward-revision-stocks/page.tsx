import { getUpwardRevisionRanking } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: '上方修正銘柄一覧｜日本株の上方修正ランキング',
        description: '日本株の上方修正銘柄をランキング形式で紹介。修正率、企業情報、AI決算分析を確認できます。TDnet開示をもとに最新の上方修正情報をリアルタイムで配信中。',
    };
}

export default async function UpwardRevisionStocksPage() {
    const rankings = await getUpwardRevisionRanking(50);
    const BASE_URL = 'https://rich-investor-news.com';

    // Structured Data: Breadcrumb & Article
    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": BASE_URL },
                { "@type": "ListItem", "position": 2, "name": "上方修正銘柄一覧", "item": `${BASE_URL}/upward-revision-stocks` }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "上方修正銘柄一覧｜日本株の最新上方修正ランキング",
            "description": "日本株の上方修正銘柄を一覧で紹介します。TDnet開示をもとにAI解析を行い、修正率の高い銘柄をランキング表示しています。",
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

            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', borderBottom: '3px solid #38bdf8', paddingBottom: '0.5rem' }}>
                上方修正銘柄一覧｜日本株の最新上方修正ランキング
            </h1>

            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                このページでは、日本株の上方修正銘柄を一覧で紹介します。
                TDnet開示をもとにAI解析を行い、修正率（営業利益）の高い銘柄を現在のランキング形式で表示しています。
                業績の上振れは株価のポジティブ転換の強力なシグナルとなります。
            </div>

            <div style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '0.9rem' }}>
                            <th style={{ padding: '1rem' }}>銘柄名 (コード)</th>
                            <th style={{ padding: '1rem' }}>修正率 (営業利益)</th>
                            <th style={{ padding: '1rem' }}>修正内容 / 分析</th>
                            <th style={{ padding: '1rem' }}>修正日</th>
                            <th style={{ padding: '1rem' }}>市場</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((rev: any) => (
                            <tr key={rev.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }} className="hover:bg-slate-800/50">
                                <td style={{ padding: '1rem' }}>
                                    <div>
                                        <Link href={`/stocks/${rev.ticker}`} style={{ color: '#60a5fa', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.1rem' }}>
                                            {rev.company_name}
                                        </Link>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{rev.ticker} / {rev.sector}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        +{rev.revision_rate_op}%
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', maxWidth: '300px' }}>
                                    <Link href={`/revisions/${rev.id}`} style={{ textDecoration: 'none', color: '#cbd5e1' }}>
                                        <div style={{ fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {rev.ai_summary || rev.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '0.4rem' }}>
                                            AI分析の詳細をみる &rarr;
                                        </div>
                                    </Link>
                                </td>
                                <td style={{ padding: '1rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                    {rev.revision_date}
                                </td>
                                <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                                    {rev.market || '東証'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', color: '#94a3b8', fontSize: '0.9rem' }}>
                <h3 style={{ color: '#f8fafc', marginBottom: '1rem' }}>💡 上方修正銘柄をチェックするメリット</h3>
                <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                    <li><strong>成長性の再評価</strong>: 市場予想を上回る上方修正は、企業の収益力が強化されている証拠です。</li>
                    <li><strong>割安感の発生</strong>: 利益予想が上がるとPER（株価収益率）が低下し、相対的に株価が割安になることがあります。</li>
                    <li><strong>機関投資家の買い</strong>: 業績の改善に伴い、ファンドなどの大口資金が流入しやすくなります。</li>
                </ul>
            </div>
        </div>
    );
}
