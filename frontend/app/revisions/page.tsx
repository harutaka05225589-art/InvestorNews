import React, { Fragment } from 'react';
import Link from 'next/link';
import styles from './revisions.module.css';
import AdSenseInFeed from '../../components/ads/AdSenseInFeed';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

// Server-side types
interface Revision {
    id: number;
    ticker: string;
    company_name: string;
    revision_date: string;
    description?: string;
    source_url?: string;
    title?: string;
    is_upward?: number;
    revision_rate_op?: number;
    ai_summary?: string;
    ai_analyzed?: number;
    is_dividend_hike?: number;
    dividend_forecast_annual?: number;
    dividend_forecast_previous?: number;
    category?: string;
}

// Data fetching logic directly in Server Component
async function getRevisionsData(category: string, search: string) {
    let query = `
        SELECT * FROM revisions
        WHERE title NOT IN ('System_Dividend_Update', 'YahooFinance_Initial')
    `;
    const params: any[] = [];

    if (search) {
        query += ` AND (ticker LIKE ? OR company_name LIKE ? OR title LIKE ? OR ai_summary LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Category Filter
    if (category === 'earnings') {
        query += ` AND category IN ('earnings', 'both')`;
    } else if (category === 'dividend') {
        query += ` AND category IN ('dividend', 'both')`;
    } else if (category === 'buyback') {
        query += ` AND category = 'buyback'`;
    } else if (category === 'all') {
        // Exclude pure buybacks from "All" to keep it performance focused, matching original frontend logic
        query += ` AND (revision_rate_op IS NOT NULL OR is_dividend_hike = 1 OR category = 'both')`;
    } else {
        // Default: Performance focused
        query += ` AND (revision_rate_op IS NOT NULL OR is_dividend_hike = 1 OR category = 'both')`;
    }

    query += ` ORDER BY revision_date DESC, id DESC LIMIT 50`;

    const stmt = db.prepare(query);
    return stmt.all(...params) as Revision[];
}

// Metadata generation for SEO
export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const category = (searchParams.category as string) || 'all';
    const q = (searchParams.q as string) || '';
    
    let title = '業績修正速報 - Investor News';
    let description = '上場企業の業績予想修正（上方修正・下方修正）や増配、自社株買い情報をリアルタイムで一覧表示。AIが適時開示を自動解析し、投資に役立つ情報を抽出します。';

    if (category === 'earnings') {
        title = '業績修正ランキング・一覧 - Investor News';
        description = '企業の業績上方修正・下方修正の最新情報を。AIによる要約と修正率ランキングで、次に動く銘柄を素早く見つけられます。';
    } else if (category === 'dividend') {
        title = '増配・減配情報一覧 - Investor News';
        description = '上場企業の配当予想修正をリアルタイム更新。増配銘柄や利回り向上銘柄をAIがピックアップ。';
    } else if (category === 'buyback') {
        title = '自社株買い発表一覧 - Investor News';
        description = '最新の自社株買い発表企業を一覧表示。株主還元に積極的な銘柄をチェック。';
    }

    if (q) {
        title = `「${q}」の業績修正検索結果 - Investor News`;
    }

    return {
        title,
        description,
        alternates: {
            canonical: `/revisions${category !== 'all' ? `?category=${category}` : ''}`,
        },
    };
}

export default async function RevisionsPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const category = (searchParams.category as string) || 'all';
    const searchQuery = (searchParams.q as string) || '';

    const revisions = await getRevisionsData(category, searchQuery);

    return (
        <main className={styles.container}>
            {/* JSON-LD for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "itemListElement": revisions.map((rev, i) => ({
                            "@type": "ListItem",
                            "position": i + 1,
                            "url": `https://rich-investor-news.com/revisions/${rev.id}`,
                            "name": `${rev.ticker} ${rev.company_name} - ${rev.title || '業績修正'}`
                        }))
                    })
                }}
            />
            <header className={styles.header}>
                <h1 className={styles.title}>
                    📊 業績修正速報
                    <span style={{ fontSize: '0.8rem', background: 'var(--accent)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>Beta</span>
                </h1>
                <p className={styles.subtitle}>
                    AIがPDFを自動解析し「上方修正」「下方修正」を判定します。
                </p>
                <div style={{ maxWidth: '800px', margin: '1rem auto', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                    <p>
                        本ページでは、TDnet（適時開示情報）で発表された企業の業績予想修正をリアルタイムで一覧表示しています。
                        業績修正は株価変動の大きな要因となります。特に「上方修正」や「増配」はポジティブ材料として注目されます。
                        AI要約を活用して、修正の理由（為替、価格転嫁、コスト増など）を素早く把握し、投資判断にお役立てください。
                    </p>
                </div>

                {/* Ranking & Quick Links */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <Link href="/revisions/ranking/upside" style={{ padding: '0.5rem 1rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--accent)', borderRadius: '20px', fontSize: '0.85rem', textDecoration: 'none', color: 'var(--accent)' }}>
                        🚀 上方修正ランキング
                    </Link>
                    <Link href="/revisions/ranking/dividend" style={{ padding: '0.5rem 1rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', borderRadius: '20px', fontSize: '0.85rem', textDecoration: 'none', color: '#fbbf24' }}>
                        💰 増配ランキング
                    </Link>
                    <Link href="/revisions/ranking/buyback" style={{ padding: '0.5rem 1rem', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid #a855f7', borderRadius: '20px', fontSize: '0.85rem', textDecoration: 'none', color: '#a855f7' }}>
                        💎 自社株買い
                    </Link>
                    <Link href="/revisions/ranking/surprise" style={{ padding: '0.5rem 1rem', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid #f87171', borderRadius: '20px', fontSize: '0.85rem', textDecoration: 'none', color: '#f87171' }}>
                        🔥 決算サプライズ
                    </Link>
                    <Link href="/revisions/ranking/hot" style={{ padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '20px', fontSize: '0.85rem', textDecoration: 'none', color: '#3b82f6' }}>
                        ⚡ 注目銘柄
                    </Link>
                    <Link href="/revision-rate-ranking" style={{ padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid #6366f1', borderRadius: '20px', fontSize: '0.85rem', textDecoration: 'none', color: '#6366f1' }}>
                        📊 修正率位
                    </Link>
                    <Link href="/earnings-this-week" style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '20px', fontSize: '0.85rem', textDecoration: 'none', color: '#10b981' }}>
                        📅 今週の決算
                    </Link>
                    <Link href="/investor-buying" style={{ padding: '0.5rem 1rem', background: 'rgba(236, 72, 153, 0.1)', border: '1px solid #fb7185', borderRadius: '20px', fontSize: '0.85rem', textDecoration: 'none', color: '#fb7185' }}>
                        👤 投資家買い増し
                    </Link>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/revisions/today" style={{ textDecoration: 'none', color: '#fff', background: '#334155', padding: '0.5rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #475569' }}>📅 今日</Link>
                    <Link href="/revisions/this-week" style={{ textDecoration: 'none', color: '#fff', background: '#334155', padding: '0.5rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #475569' }}>📅 今週</Link>
                    <Link href="/revisions/this-month" style={{ textDecoration: 'none', color: '#fff', background: '#334155', padding: '0.5rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #475569' }}>📅 今月</Link>
                    <Link href="/revisions" style={{ textDecoration: 'none', color: '#fff', background: '#334155', padding: '0.5rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #475569' }}>🔄 全て</Link>
                </div>
            </header>

            {/* Category Tabs using Links for SSR Navigation */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <Link href="/revisions?category=earnings" style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '0.6rem 1.2rem', borderRadius: '20px', background: category === 'earnings' ? 'var(--accent)' : '#334155', color: category === 'earnings' ? '#000' : '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>業績修正</button>
                </Link>
                <Link href="/revisions?category=dividend" style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '0.6rem 1.2rem', borderRadius: '20px', background: category === 'dividend' ? 'var(--accent)' : '#334155', color: category === 'dividend' ? '#000' : '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>配当修正</button>
                </Link>
                <Link href="/revisions?category=buyback" style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '0.6rem 1.2rem', borderRadius: '20px', background: category === 'buyback' ? 'var(--accent)' : '#334155', color: category === 'buyback' ? '#000' : '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>自社株買い</button>
                </Link>
                <Link href="/revisions?category=all" style={{ textDecoration: 'none' }}>
                    <button style={{ padding: '0.6rem 1.2rem', borderRadius: '20px', background: category === 'all' ? 'var(--accent)' : '#334155', color: category === 'all' ? '#000' : '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>すべて</button>
                </Link>
            </div>

            {/* Search Bar - Logic: Form submission for SSR */}
            <form action="/revisions" method="GET" style={{ maxWidth: '600px', margin: '0 auto 2rem auto', position: 'relative' }}>
                <input type="hidden" name="category" value={category} />
                <input 
                    type="text" 
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="銘柄コードまたは社名で検索..." 
                    style={{ width: '100%', padding: '1rem 1.2rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '30px', color: '#fff', fontSize: '1rem', outline: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
                />
                <button type="submit" style={{ position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: 'bold' }}>検索</button>
            </form>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>日付</th>
                            <th>コード</th>
                            <th>銘柄名</th>
                            <th>AI判定</th>
                            <th>開示詳細</th>
                        </tr>
                    </thead>
                    <tbody>
                        {revisions.map((rev, index) => {
                            let displayMode = category === 'all' ? (rev.category || 'earnings') : category;
                            if (rev.category === 'both') displayMode = 'both';
                            
                            let badgeLabel = '―';
                            let badgeClass = 'neutral';
                            let valueDisplay = null;

                            // UI Logic
                            if (rev.ai_analyzed === 0) {
                                badgeLabel = '⏳ 解析待ち';
                            } else if (rev.ai_analyzed === 2) {
                                badgeLabel = '⚠️ 解析エラー';
                                badgeClass = 'down';
                            } else if (displayMode === 'buyback') {
                                badgeClass = 'up';
                                badgeLabel = '🚀 自社株買い';
                            } else if (displayMode === 'dividend') {
                                if (rev.is_dividend_hike === 1) {
                                    badgeClass = 'up';
                                    badgeLabel = '💰 増配';
                                } else if (rev.is_dividend_hike === -1) {
                                    badgeClass = 'down';
                                    badgeLabel = '📉 減配';
                                } else {
                                    badgeLabel = '配当修正';
                                }

                                if (rev.dividend_forecast_annual) {
                                    const diff = (rev.dividend_forecast_annual || 0) - (rev.dividend_forecast_previous || 0);
                                    valueDisplay = (
                                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--profit)' }}>{rev.dividend_forecast_annual}円</span>
                                            {rev.dividend_forecast_previous && diff !== 0 && (
                                                <span style={{ fontSize: '0.75rem', color: diff > 0 ? '#4ade80' : '#ef4444' }}>
                                                    ({diff > 0 ? '+' : ''}{diff}円)
                                                </span>
                                            )}
                                        </div>
                                    );
                                }
                            } else if (displayMode === 'both') {
                                const isDecrease = rev.is_dividend_hike === -1;
                                badgeClass = isDecrease ? 'down' : 'up';
                                badgeLabel = isDecrease ? '上方・減配' : '🚀 上方・増配';

                                const rate = rev.revision_rate_op;
                                const divDiff = (rev.dividend_forecast_annual || 0) - (rev.dividend_forecast_previous || 0);

                                valueDisplay = (
                                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                        {rate && rate !== 0 && (
                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: rate > 0 ? '#4ade80' : '#f87171' }}>
                                                {rate > 0 ? '+' : ''}{Number(rate).toFixed(1)}%
                                            </span>
                                        )}
                                        {rev.dividend_forecast_annual && (
                                            <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>配{rev.dividend_forecast_annual}円</span>
                                                {divDiff !== 0 && (
                                                    <span style={{ marginLeft: '4px', color: divDiff > 0 ? '#4ade80' : '#ef4444' }}>({divDiff > 0 ? '+' : ''}{divDiff})</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            } else {
                                const rate = rev.revision_rate_op;
                                if (!rate || rate === 0) {
                                    badgeLabel = '修正';
                                } else {
                                    const type = rev.is_upward === 1 ? 'up' : rev.is_upward === 0 ? 'down' : 'neutral';
                                    badgeClass = type;
                                    badgeLabel = type === 'up' ? '↗ 上方修正' : type === 'down' ? '↘ 下方修正' : '修正';
                                    valueDisplay = (
                                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: rate > 0 ? '#4ade80' : '#f87171' }}>
                                            {rate > 0 ? '+' : ''}{Number(rate).toFixed(2)}%
                                        </span>
                                    );
                                }
                            }

                            return (
                                <Fragment key={rev.id}>
                                    <tr>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.9rem', color: '#ccc' }}>{rev.revision_date}</td>
                                        <td>
                                            <Link href={`/stocks/${rev.ticker}`} className={styles.tickerLink} style={{ color: '#60a5fa', fontWeight: 'bold', textDecoration: 'none' }}>
                                                {rev.ticker}
                                            </Link>
                                        </td>
                                        <td style={{ minWidth: '250px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Link href={`/revisions/${rev.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <span style={{ fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: '#475569' }} className={styles.companyLink}>
                                                        {rev.company_name}
                                                    </span>
                                                </Link>
                                            </div>
                                            {rev.ai_summary && !rev.ai_summary.includes('Failed') && (
                                                <div style={{
                                                    marginTop: '0.8rem',
                                                    padding: '0.8rem 1rem',
                                                    background: 'rgba(56, 189, 248, 0.05)',
                                                    borderLeft: '3px solid var(--primary)',
                                                    borderRadius: '0 6px 6px 0',
                                                    fontSize: '0.95rem',
                                                    color: '#f8fafc',
                                                    lineHeight: '1.6',
                                                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
                                                }}>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--primary)', marginRight: '0.4rem', fontSize: '1rem' }}>💡ポイント:</span>
                                                    {rev.ai_summary}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ minWidth: '120px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span className={`${styles.badge} ${styles[badgeClass]}`}>
                                                    {badgeLabel}
                                                </span>
                                                {valueDisplay}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {rev.source_url ? (
                                                    <a href={rev.source_url} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
                                                        📄 PDF
                                                    </a>
                                                ) : '-'}
                                            </div>
                                        </td>
                                    </tr>
                                    {(index + 1) % 10 === 0 && (
                                        <tr key={`ad-${index}`} className={styles.adRow}>
                                            <td colSpan={5} className={styles.adCell} style={{ padding: 0, background: 'transparent', border: 'none' }}>
                                                <AdSenseInFeed slotId="3072451399" layoutKey="-fb+5w+4e-db+86" />
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}

                        {revisions.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>
                                    表示できるデータがありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Sector Index for SEO Siloing */}
            <div style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid #334155' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📁 業種（セクター）別に探す
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.8rem' }}>
                    {[
                        { slug: 'info-telecom', label: '情報・通信業' },
                        { slug: 'services', label: 'サービス業' },
                        { slug: 'retail', label: '小売業' },
                        { slug: 'wholesale', label: '卸売業' },
                        { slug: 'machinery', label: '機械' },
                        { slug: 'electric', label: '電気機器' },
                        { slug: 'construction', label: '建設業' },
                        { slug: 'pharma', label: '医薬品' },
                        { slug: 'chemicals', label: '化学' },
                        { slug: 'foods', label: '食料品' },
                        { slug: 'real-estate', label: '不動産業' },
                        { slug: 'banking', label: '銀行業' },
                        { slug: 'other-finance', label: 'その他金融業' },
                    ].map(s => (
                        <Link key={s.slug} href={`/revisions/sector/${s.slug}`} style={{
                            padding: '0.6rem 1rem',
                            background: '#1e293b',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            color: '#60a5fa',
                            textDecoration: 'none',
                            border: '1px solid #334155',
                            textAlign: 'center'
                        }}>
                            {s.label}
                        </Link>
                    ))}
                </div>
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>※その他すべての業種も順次最適化中</p>
                </div>
            </div>

            {/* E-E-A-T: Trust & Transparency Section */}
            <section style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🛡️ 信頼性と透明性への取り組み（AI解析について）
                </h2>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.8' }}>
                    <p style={{ marginBottom: '1rem' }}>
                        Investor Newsでは、上場企業から発表される適時開示情報（TDnet）をAI（Gemini 1.5 Pro等）が即時に解析し、投資家の皆様が素早く投資判断を行えるよう要約を提供しています。
                    </p>
                    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                        <li style={{ marginBottom: '0.5rem' }}>✅ <strong>データの正確性:</strong> AIによる要約は、原文の数値を基に構成されていますが、稀に解釈の誤りが生じる可能性があります。重要な判断の際は、必ず提供されているPDF（原文）をご確認ください。</li>
                        <li style={{ marginBottom: '0.5rem' }}>✅ <strong>解析のプロセス:</strong> TDnetからPDFを取得後、AIが「売上・利益の修正要因」「増配の理由」「今後の見通し」を抽出し、人間が読みやすい形式に整形しています。</li>
                        <li style={{ marginBottom: '0.5rem' }}>✅ <strong>投資助言の否定:</strong> 本サービスは情報提供のみを目的としており、特定の銘柄の売買を推奨するものではありません。投資の最終決定は、ご自身の判断と責任で行ってください。</li>
                    </ul>
                </div>
            </section>
        </main>
    );
}
