import { getBuybackRanking } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: '自社株買い銘柄一覧｜日本株の自社株買いランキング',
        description: '日本株の自社株買い銘柄をランキング形式で紹介。自社株買い額や企業情報を確認できます。株主還元を強化する企業の最新IR情報をAIが解析して配信。',
    };
}

export default async function ShareBuybackStocksPage() {
    const rankings = await getBuybackRanking(50);
    const BASE_URL = 'https://rich-investor-news.com';

    // Structured Data: Breadcrumb & Article
    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": BASE_URL },
                { "@type": "ListItem", "position": 2, "name": "自社株買い銘柄一覧", "item": `${BASE_URL}/share-buyback-stocks` }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "自社株買い銘柄一覧｜日本株の最新自社株買いランキング",
            "description": "日本株の自社株買い銘柄を一覧で紹介します。自社株買い額、時価総額比率、企業情報を確認できます。",
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

            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', borderBottom: '3px solid #a855f7', paddingBottom: '0.5rem' }}>
                自社株買い銘柄一覧｜日本株の最新自社株買いランキング
            </h1>

            <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid #a855f7', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                日本株の自社株買い銘柄を一覧で紹介します。
                企業による「自己株式の取得」は、市場での株式数を減らし、1株あたりの利益（EPS）を向上させる強力な株主還元策です。
                AIが発表内容を解析し、取得枠の規模やスケジュールをわかりやすく一覧化しています。
            </div>

            <div style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '0.9rem' }}>
                            <th style={{ padding: '1rem' }}>銘柄名 (コード)</th>
                            <th style={{ padding: '1rem' }}>内容 / AI要約</th>
                            <th style={{ padding: '1rem' }}>発表日</th>
                            <th style={{ padding: '1rem' }}>リンク</th>
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
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{rev.ticker} / {rev.market}</div>
                                </td>
                                <td style={{ padding: '1rem', maxWidth: '400px' }}>
                                    <div style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        {rev.ai_summary || rev.title}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                    {rev.revision_date}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <Link href={`/revisions/${rev.id}`} style={{ textDecoration: 'none', color: '#a855f7', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        詳細を確認 &rarr;
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '3rem', padding: '2rem', border: '1px solid #334155', borderRadius: '12px' }}>
                <h2 style={{ color: '#f8fafc', marginBottom: '1rem', fontSize: '1.4rem' }}>自社株買いが投資家に好まれる理由</h2>
                <div style={{ color: '#94a3b8', lineHeight: '1.8' }}>
                    <p>自社株買い（自己株式取得）は、企業が自らの利益で市場から自社の株を買い戻すことです。これにより以下の効果が期待できます。</p>
                    <ul style={{ marginTop: '1rem' }}>
                        <li><strong>1株あたり価値の向上</strong>: 株式総数が減るため、1株あたりの純利益（EPS）や純資産（BPS）が上昇します。</li>
                        <li><strong>需給の改善</strong>: 市場での売り圧力が吸収され、株価の下支えや上昇要因となります。</li>
                        <li><strong>経営陣の自信</strong>: 「自社の株価は現状、割安である」という経営陣からの強いメッセージと受け取られます。</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
