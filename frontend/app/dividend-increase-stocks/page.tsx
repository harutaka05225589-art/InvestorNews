import { getDividendIncreaseRanking } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: '増配銘柄一覧｜日本株の配当増加ランキング',
        description: '日本株の増配銘柄をランキング形式で紹介。配当利回りや増配率を確認できます。最新の株主還元・配当予想の上方修正をAIが詳しく解説。',
    };
}

export default async function DividendIncreaseStocksPage() {
    const rankings = await getDividendIncreaseRanking(50);
    const BASE_URL = 'https://rich-investor-news.com';

    // Structured Data: Breadcrumb & Article
    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": BASE_URL },
                { "@type": "ListItem", "position": 2, "name": "増配銘柄一覧", "item": `${BASE_URL}/dividend-increase-stocks` }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "増配銘柄一覧｜日本株の最新増配ランキング",
            "description": "日本株の増配銘柄を一覧で紹介します。配当増加率、配当利回り、企業情報を確認できます。",
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

            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', borderBottom: '3px solid #fbbf24', paddingBottom: '0.5rem' }}>
                増配銘柄一覧｜日本株の最新増配ランキング
            </h1>

            <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                日本株の増配銘柄を一覧で紹介します。
                年間の配当予想が上方修正された銘柄を対象に、増加率の高い順に表示しています。
                高配当投資やインカムゲインを重視する投資家にとって、増配は企業の安定した収益力と還元姿勢を示す重要な指標です。
            </div>

            <div style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '0.9rem' }}>
                            <th style={{ padding: '1rem' }}>銘柄名 (コード)</th>
                            <th style={{ padding: '1rem' }}>配当増加率</th>
                            <th style={{ padding: '1rem' }}>配当予想 (年間)</th>
                            <th style={{ padding: '1rem' }}>発表日</th>
                            <th style={{ padding: '1rem' }}>詳細分析</th>
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
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        +{Number(rev.increase_rate).toFixed(1)}%
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{rev.dividend_forecast_annual}円</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>前回: {rev.dividend_forecast_previous}円</div>
                                </td>
                                <td style={{ padding: '1rem', color: '#94a3b8' }}>
                                    {rev.revision_date}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <Link href={`/revisions/${rev.id}`} style={{ textDecoration: 'none', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        決算・修正詳細 &rarr;
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '3rem', borderTop: '1px solid #334155', paddingTop: '2rem' }}>
                <h2 style={{ color: '#f8fafc', marginBottom: '1rem', fontSize: '1.4rem' }}>増配銘柄への投資戦略</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    <div style={{ padding: '1.5rem', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                        <h4 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>連動する増益トレンド</h4>
                        <p>増配は通常、業績の拡大とセットで行われます。配当だけでなく、利益成長による株価上昇（キャピタルゲイン）も期待できる場合が多いです。</p>
                    </div>
                    <div style={{ padding: '1.5rem', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                        <h4 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>下値の堅さ</h4>
                        <p>配当利回りが高まると、株価下落時に利回り狙いの買いが入りやすくなり、下値公差が強まる傾向があります。</p>
                    </div>
                    <div style={{ padding: '1.5rem', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                        <h4 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>株主還元姿勢</h4>
                        <p>配当性向の引き上げや累進配当の導入を同時に発表する銘柄は、経営サイドが株価を重視している証拠です。</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
