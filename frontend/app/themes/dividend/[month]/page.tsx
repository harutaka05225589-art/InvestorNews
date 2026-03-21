import { getStocksByRightsMonth } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
    const { month: monthStr } = await params;
    const month = parseInt(monthStr, 10);
    if (isNaN(month) || month < 1 || month > 12) {
        return { title: 'Not Found' };
    }

    return {
        title: `${month}月 権利確定銘柄（高配当・増配まとめ）｜日本株の配当情報`,
        description: `${month}月に権利確定を迎える日本株の配当銘柄一覧です。最新の配当予想、AIによる業績評価、増配履歴を網羅しています。高配当投資やインカムゲイン狙いの投資家必見の情報です。`,
    };
}

export default async function MonthDividendStocksPage({ params }: { params: Promise<{ month: string }> }) {
    const { month: monthStr } = await params;
    const month = parseInt(monthStr, 10);
    if (isNaN(month) || month < 1 || month > 12) {
        notFound();
    }

    const stocks = await getStocksByRightsMonth(month, 100);
    const BASE_URL = 'https://rich-investor-news.com';

    // Structured Data: Breadcrumb & ItemList
    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": BASE_URL },
                { "@type": "ListItem", "position": 2, "name": "テーマ別", "item": `${BASE_URL}/themes` },
                { "@type": "ListItem", "position": 3, "name": `${month}月権利確定銘柄`, "item": `${BASE_URL}/themes/dividend/${month}` }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": `${month}月 権利確定・高配当銘柄一覧`,
            "description": `${month}月に権利を確定する注目の配当銘柄リストです。`,
            "itemListElement": stocks.map((stock: any, index: number) => ({
                "@type": "ListItem",
                "position": index + 1,
                "url": `${BASE_URL}/stocks/${stock.ticker}`
            }))
        }
    ];

    return (
        <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', borderBottom: '3px solid #fbbf24', paddingBottom: '0.5rem' }}>
                {month}月 権利確定銘柄｜配当情報・業績評価まとめ
            </h1>

            <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                <p>
                    {month}月に権利確定を迎える日本株の配当銘柄一覧です。
                    最新の配当予想額（年間）が高い順に表示しています。AIが解析した最新の業績修正情報も合わせて確認でき、配当投資のポートフォリオ構築に役立ちます。
                </p>
            </div>

            {/* Quick Links to other months */}
            <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                    <Link key={m} href={`/themes/dividend/${m}`} style={{
                        padding: '0.5rem 1rem', 
                        borderRadius: '20px', 
                        background: m === month ? '#fbbf24' : '#1e293b', 
                        color: m === month ? '#0f172a' : '#cbd5e1',
                        border: `1px solid ${m === month ? '#fbbf24' : '#334155'}`,
                        textDecoration: 'none', 
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                    }}>
                        {m}月
                    </Link>
                ))}
            </div>

            {stocks.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '12px' }}>
                    データが見つかりませんでした。
                </div>
            ) : (
                <div style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '0.9rem' }}>
                                <th style={{ padding: '1rem' }}>銘柄名 (コード)</th>
                                <th style={{ padding: '1rem' }}>年間配当予想</th>
                                <th style={{ padding: '1rem' }}>支払月</th>
                                <th style={{ padding: '1rem' }}>AI 要約 (過去の主な修正要因)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stocks.map((stock: any) => (
                                <tr key={stock.ticker} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }} className="hover:bg-slate-800/50">
                                    <td style={{ padding: '1rem', width: '25%' }}>
                                        <div>
                                            <Link href={`/stocks/${stock.ticker}`} style={{ color: '#60a5fa', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.1rem' }}>
                                                {stock.company_name_c || stock.company_name || stock.ticker}
                                            </Link>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                            {stock.ticker} {stock.sector ? `/ ${stock.sector}` : ''}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', width: '15%' }}>
                                        <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                            {stock.dividend_forecast_annual ? `${stock.dividend_forecast_annual}円` : '―'}
                                        </div>
                                        {stock.is_dividend_hike === 1 && (
                                            <div style={{ display: 'inline-block', fontSize: '0.7rem', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>
                                                直近増配
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#cbd5e1', width: '10%' }}>
                                        {stock.dividend_payment_month ? `${stock.dividend_payment_month}月` : '不明'}
                                    </td>
                                    <td style={{ padding: '1rem', width: '50%' }}>
                                        <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {stock.ai_summary || "最新のAI要約はありません"}
                                        </div>
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <Link href={`/revisions/${stock.id}`} style={{ textDecoration: 'none', color: '#60a5fa', fontSize: '0.8rem' }}>
                                                詳細レポート &rarr;
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
