import React, { Fragment } from 'react';
import Link from 'next/link';
import styles from '../revisions.module.css';
import db, { getRevisionsByDateRange } from '@/lib/db';

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
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    return {
        title: '今週の業績修正速報まとめ - Investor News',
        description: '今週発表された重要な業績予想修正、増配、自社株買い情報を集約。AIが注目ポイントを要約して提供します。',
        alternates: {
            canonical: '/revisions/this-week',
        },
    };
}

export default async function ThisWeekRevisionsPage() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    const end = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

    const sy = start.getFullYear();
    const sm = String(start.getMonth() + 1).padStart(2, '0');
    const sd = String(start.getDate()).padStart(2, '0');
    const startDate = `${sy}-${sm}-${sd}`;

    const ey = end.getFullYear();
    const em = String(end.getMonth() + 1).padStart(2, '0');
    const ed = String(end.getDate()).padStart(2, '0');
    const endDate = `${ey}-${em}-${ed}`;

    const revisions = getRevisionsByDateRange(startDate, endDate, 'all') as Revision[];

    const validRevisions = revisions.filter(rev => {
        const hasRate = rev.revision_rate_op !== undefined && rev.revision_rate_op !== null && Number(rev.revision_rate_op) !== 0;
        const isDividendHike = rev.is_dividend_hike === 1;
        const isBoth = rev.category === 'both';
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
                <h1 className={styles.title}>
                    📅 今週の業績修正速報
                </h1>
                <p className={styles.subtitle}>
                    今週発表された業績予想の修正一覧です。
                </p>
                <div style={{ maxWidth: '800px', margin: '1rem auto', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                    <p>
                        今週1週間の業績修正トレンドを確認できます。
                        特定セクター（例：自動車、半導体）で修正が相次いでいないか、連れ高・連れ安のヒントを探るのに役立ちます。
                        見落としていた高配当株や好業績株の拾い直しにもご活用ください。
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
                                        今週の発表はまだありません
                                    </td>
                                </tr>
                            )}
                            {validRevisions.map((rev) => {
                                let displayMode = rev.category || 'earnings';
                                if (rev.category === 'both') displayMode = 'both';
                                else if (!rev.category && rev.dividend_forecast_annual) displayMode = 'dividend';

                                let badgeLabel = '―';
                                let badgeClass = 'neutral';
                                let valueDisplay = null;

                                if (displayMode === 'buyback') {
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
                                    <tr key={rev.id}>
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
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
