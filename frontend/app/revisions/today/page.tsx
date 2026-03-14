import React, { Fragment } from 'react';
import Link from 'next/link';
import styles from '../revisions.module.css';
import db, { getRevisionsByDateRange } from '@/lib/db';

// Type definition (Shared ideally, but duplicating for speed)
// Helper to determine revision type
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

// Metadata generation for SEO
export async function generateMetadata() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    
    return {
        title: `${dateStr}の業績修正速報 - Investor News`,
        description: `${dateStr}に発表された上場企業の業績予想修正（上方修正・下方修正）、増配、自社株買い情報をAI解析。最新の市場動向をいち早くキャッチ。`,
        alternates: {
            canonical: '/revisions/today',
        },
    };
}

export default async function TodayRevisionsPage() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const revisions = getRevisionsByDateRange(dateStr, dateStr, 'all') as Revision[];

    // Strict Filter Logic
    const validRevisions = revisions.filter(rev => {
        const hasRate = rev.revision_rate_op !== undefined && rev.revision_rate_op !== null && Number(rev.revision_rate_op) !== 0;
        const isDividendHike = rev.is_dividend_hike === 1;
        const isBoth = rev.category === 'both';

        // 'all' category: Exclude Buyback
        return hasRate || isDividendHike || isBoth;
    });

    return (
        <main className={styles.container}>
            {/* JSON-LD for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "itemListElement": validRevisions.map((rev, i) => ({
                            "@type": "ListItem",
                            "position": i + 1,
                            "url": `https://rich-investor-news.com/revisions/${rev.id}`,
                            "name": `${rev.ticker} ${rev.company_name} - ${rev.title || '業績修正'}`
                        }))
                    })
                }}
            />
            <header className={styles.header}>
                <h1 className={styles.title} style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                    📈 今日の業績修正速報｜上方修正・下方修正銘柄一覧（AI要約付き）
                </h1>
                <p className={styles.subtitle}>
                    今日発表された業績予想の修正一覧です。
                </p>
                <div style={{ maxWidth: '800px', margin: '1rem auto', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', background: 'rgba(30, 41, 59, 0.5)', padding: '1.5rem', borderRadius: '8px' }}>
                    <p>
                        本ページでは、本日発表された全上場企業の業績修正（上方修正・下方修正・配当修正）をリアルタイムで一覧化しています。「明日の急騰期待銘柄探し」や「今日の業績推移」の確認にご活用ください。AIが各企業の開示資料（TDnet）を瞬時に読み解き、修正理由を一目でわかるように解説します。<br />
                        ※市場が閉まった後（大引け後15:00〜）に追加された情報は、翌営業日の株価に大きく影響する可能性があります。
                    </p>
                </div>
                <Link href="/revisions" style={{ fontSize: '0.9rem', color: 'var(--accent)', textDecoration: 'underline' }}>
                    &larr; 全ての一覧に戻る
                </Link>
            </header>

            <section>
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
                            {validRevisions.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                        本日の発表はまだありません
                                    </td>
                                </tr>
                            )}
                            {validRevisions.map((rev) => {
                                // Smart Display Logic (Category Aware)
                                let displayMode = rev.category || 'earnings';
                                if (rev.category === 'both') displayMode = 'both';
                                else if (!rev.category && rev.dividend_forecast_annual) displayMode = 'dividend';

                                let badgeLabel = '―';
                                let badgeClass = 'neutral';
                                let valueDisplay = null;

                                if (displayMode === 'buyback') {
                                    badgeClass = 'up';
                                    badgeLabel = '🚀 自社株買い';
                                }
                                else if (displayMode === 'dividend') {
                                    if (rev.is_dividend_hike === 1) {
                                        badgeClass = 'up';
                                        badgeLabel = '💰 増配';
                                    } else if (rev.is_dividend_hike === -1) {
                                        badgeClass = 'down';
                                        badgeLabel = '📉 減配';
                                    } else {
                                        badgeLabel = '配当修正';
                                    }

                                    const divDiff = (rev.dividend_forecast_annual || 0) - (rev.dividend_forecast_previous || 0);
                                    if (rev.dividend_forecast_annual) {
                                        valueDisplay = (
                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--profit)' }}>
                                                    {rev.dividend_forecast_annual}円
                                                </span>
                                                {rev.dividend_forecast_previous && divDiff !== 0 && (
                                                    <span style={{ fontSize: '0.75rem', color: divDiff > 0 ? '#4ade80' : '#ef4444' }}>
                                                        ({divDiff > 0 ? '+' : ''}{divDiff}円)
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    }
                                }
                                else if (displayMode === 'both') {
                                    const isDecrease = rev.is_dividend_hike === -1;

                                    if (isDecrease) {
                                        badgeClass = 'down';
                                        badgeLabel = '上方・減配';
                                    } else {
                                        badgeClass = 'up';
                                        badgeLabel = '🚀 上方・増配';
                                    }

                                    const rate = rev.revision_rate_op;
                                    const divDiff = (rev.dividend_forecast_annual || 0) - (rev.dividend_forecast_previous || 0);

                                    valueDisplay = (
                                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                            {rate && rate !== 0 ? (
                                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: rate > 0 ? '#4ade80' : '#f87171' }}>
                                                    {rate > 0 ? '+' : ''}{Number(rate).toFixed(1)}%
                                                </span>
                                            ) : null}
                                            {/* Display Dividend Amount & Diff */}
                                            {rev.dividend_forecast_annual && (
                                                <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                                    <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                                                        配{rev.dividend_forecast_annual}円
                                                    </span>
                                                    {divDiff !== 0 && (
                                                        <span style={{ marginLeft: '4px', color: divDiff > 0 ? '#4ade80' : '#ef4444' }}>
                                                            ({divDiff > 0 ? '+' : ''}{divDiff})
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                else {
                                    // Earnings (Default)
                                    const rate = rev.revision_rate_op;
                                    const isZero = !rate || rate === 0;

                                    if (isZero) {
                                        // Unanalyzed or Zero -> Plain label
                                        badgeLabel = '修正';
                                        valueDisplay = <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>-</span>;
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
                                    <tr key={rev.id}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.9rem', color: '#ccc' }}>{rev.revision_date}</td>
                                        <td>
                                            <Link href={`/stocks/${rev.ticker}`} className={styles.tickerLink} style={{ color: '#60a5fa', fontWeight: 'bold', textDecoration: 'none' }}>
                                                {rev.ticker}
                                            </Link>
                                        </td>
                                        <td style={{ minWidth: '250px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {/* Link to Detail Page */}
                                                <Link href={`/revisions/${rev.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <span style={{ fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: '#475569' }} className={styles.companyLink}>
                                                        {rev.company_name}
                                                    </span>
                                                </Link>
                                            </div>
                                            {/* AI Summary */}
                                            {rev.ai_summary && !rev.ai_summary.includes('Failed') && (
                                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem', lineHeight: '1.4' }}>
                                                    🤖 {rev.ai_summary}
                                                </p>
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
                                            {rev.source_url ? (
                                                <a href={rev.source_url} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
                                                    📄 PDF
                                                </a>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                );
                            })}

                            {validRevisions.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>
                                        本日の発表はまだありません
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* E-E-A-T Disclaimer */}
            <div style={{ maxWidth: '800px', margin: '3rem auto 0', padding: '1rem 1.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6' }}>
                <p><strong>【⚠️ 投資免責事項】</strong><br />当ページに掲載されている本日の業績修正一覧およびAI要約データは、証券取引所の適時開示情報（TDnet）に基づく情報提供のみを目的としており、特定の銘柄への投資勧誘、推奨、助言を行うものではありません。株式投資に関する最終的な決定は、ご自身の判断と責任において行ってください。</p>
            </div>
        </main>
    );
}
