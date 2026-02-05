"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../revisions.module.css';

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

function getRevisionType(rev: Revision) {
    // 1. AI Analysis result (Priority)
    if (rev.ai_analyzed && rev.is_upward !== null && rev.is_upward !== undefined) {
        // If the rate is 0 or null, consider it neutral (not downward)
        if ((!rev.revision_rate_op || rev.revision_rate_op === 0) && !rev.is_dividend_hike) {
            return 'neutral';
        }
        return rev.is_upward === 1 ? 'up' : 'down';
    }

    // 2. Title fallback
    const title = rev.title || '';
    if (title.includes('上方修正')) return 'up';
    if (title.includes('下方修正')) return 'down';
    return 'neutral';
}

export default function MonthRevisionsPage() {
    const [revisions, setRevisions] = useState<Revision[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/revisions?filter=month&category=all')
            .then(res => res.json())
            .then(data => {
                if (data.revisions) {
                    setRevisions(data.revisions);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // Strict Filter Logic
    const validRevisions = revisions.filter(rev => {
        const hasRate = rev.revision_rate_op !== undefined && rev.revision_rate_op !== null && Number(rev.revision_rate_op) !== 0;
        const hasDividend = rev.dividend_forecast_annual !== undefined && rev.dividend_forecast_annual !== null;
        const isBuyback = rev.category === 'buyback';

        return hasRate || hasDividend || isBuyback;
    });

    const currentMonth = new Date().getMonth() + 1;

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    📅 今月の業績修正 ({currentMonth}月)
                </h1>
                <p className={styles.subtitle}>
                    {currentMonth}月に発表された業績予想の修正一覧です。
                </p>
                <div style={{ maxWidth: '800px', margin: '1rem auto', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '8px' }}>
                    <p>
                        今月発表された業績修正を月次で振り返ります。
                        決算発表シーズン（1月/4月/7月/10月など）には情報量が増えますが、その他の月でも突発的な修正発表があります。
                        月間の修正率ランキング上位銘柄は、中長期的な上昇トレンドに入ることも多いため要注目です。
                    </p>
                </div>
                <a href="/revisions" style={{ fontSize: '0.9rem', color: 'var(--accent)', textDecoration: 'underline' }}>
                    &larr; 全ての一覧に戻る
                </a>
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
                            {validRevisions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                        条件に一致する業績修正は見つかりませんでした。
                                    </td>
                                </tr>
                            )}
                            {validRevisions.map((rev) => {
                                // Smart Display Logic (Category Aware)
                                let displayMode = rev.category || 'earnings';
                                if (!rev.category) {
                                    if (rev.dividend_forecast_annual) displayMode = 'dividend';
                                    else displayMode = 'earnings';
                                }

                                let badgeLabel = '―';
                                let badgeClass = 'neutral';
                                let valueDisplay = null;

                                if (displayMode === 'buyback') {
                                    badgeClass = 'up';
                                    badgeLabel = '🚀 自社株買い';
                                }
                                else if (displayMode === 'dividend') {
                                    badgeClass = rev.is_dividend_hike ? 'up' : 'neutral';
                                    badgeLabel = rev.is_dividend_hike ? '💰 増配' : '配当修正';
                                    const divDiff = (rev.dividend_forecast_annual || 0) - (rev.dividend_forecast_previous || 0);
                                    if (rev.dividend_forecast_annual) {
                                        valueDisplay = (
                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--profit)' }}>
                                                    {rev.dividend_forecast_annual}円
                                                </span>
                                                {rev.dividend_forecast_previous && divDiff !== 0 && (
                                                    <span style={{ fontSize: '0.75rem', color: divDiff > 0 ? '#4ade80' : '#f87171' }}>
                                                        ({divDiff > 0 ? '+' : ''}{divDiff}円)
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    }
                                }
                                else if (displayMode === 'both') {
                                    badgeClass = 'up';
                                    badgeLabel = '🚀 上方・増配';
                                    const rate = rev.revision_rate_op;
                                    valueDisplay = (
                                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                            {rate && rate !== 0 ? (
                                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: rate > 0 ? '#4ade80' : '#f87171' }}>
                                                    {rate > 0 ? '+' : ''}{Number(rate).toFixed(1)}%
                                                </span>
                                            ) : null}
                                            {rev.is_dividend_hike === 1 && (
                                                <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                                                    + 増配
                                                </span>
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
                                        const t = getRevisionType(rev);
                                        badgeClass = t === 'up' ? 'up' : t === 'down' ? 'down' : 'neutral';
                                        badgeLabel = t === 'up' ? '↗ 修正' : t === 'down' ? '↘ 修正' : '修正';

                                        if (rev.ai_analyzed) {
                                            badgeClass = 'neutral';
                                            badgeLabel = '修正';
                                        }
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
                                            <a href={`https://finance.yahoo.co.jp/quote/${rev.ticker}.T`} target="_blank" rel="noopener noreferrer" className={styles.tickerLink}>
                                                {rev.ticker}
                                            </a>
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

                            {loading && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</td>
                                </tr>
                            )}

                            {!loading && validRevisions.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>
                                        今月の発表はまだありません
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
