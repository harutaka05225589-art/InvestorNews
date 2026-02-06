"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './revisions.module.css';

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
    dividend_forecast_annual?: number; // Added
    dividend_forecast_previous?: number; // Added
    category?: string; // matching DB column
}

function getRevisionType(rev: Revision, activeTab: string) {
    if (!rev.ai_analyzed) {
        // Fallback for unanalyzed
        const title = rev.title || '';
        if (title.includes('上方修正')) return 'up';
        if (title.includes('下方修正')) return 'down';
        return 'neutral';
    }

    // Strict Display Logic based on Tab
    if (activeTab === 'dividend') {
        return rev.is_dividend_hike ? 'up' : 'neutral'; // 'up' color for hike
    }

    // Earnings or All
    if (activeTab === 'earnings' || activeTab === 'all') {
        // If it's pure dividend in 'all', handle later. 
        // For Earnings tab, strictly check rate logic is handled in filter.
        // Here we just return direction.
        if (rev.is_upward === 1) return 'up';
        if (rev.is_upward === 0) return 'down';
    }

    return 'neutral';
}

export default function RevisionsPage() {
    const [revisions, setRevisions] = useState<Revision[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('all'); // Default to All to show Dividends/Buybacks too

    useEffect(() => {
        const fetchRevisions = () => {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) {
                params.append('q', searchQuery);
                params.append('category', 'all');
            } else {
                if (category && category !== 'all') params.append('category', category);
            }

            fetch(`/api/revisions?${params.toString()}`)
                .then(res => res.json())
                .then(data => {
                    if (data.revisions) {
                        setRevisions(data.revisions);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        };

        const timeoutId = setTimeout(() => {
            fetchRevisions();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, category]);

    // Strict Filter Logic
    const validRevisions = revisions.filter(rev => {
        // Strict Filter: Hide incomplete data

        const hasRate = rev.revision_rate_op !== undefined && rev.revision_rate_op !== null && Number(rev.revision_rate_op) !== 0;
        const isDividendHike = rev.is_dividend_hike === 1;
        const isBuyback = rev.category === 'buyback';
        const isBoth = rev.category === 'both';

        if (category === 'earnings') {
            return hasRate || isBoth;
        }

        if (category === 'dividend') {
            // Only show hikes or 'both' (which implies dividend relevance)
            return isDividendHike || isBoth;
        }

        if (category === 'buyback') {
            return isBuyback;
        }

        // 'all' category: Exclude buybacks (User Feedback: "Strange to see buybacks here")
        // Only Earnings (Valid Rate) OR Dividend Hikes OR Both
        return hasRate || isDividendHike || isBoth;
    });

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    📊 業績修正速報
                    <span style={{ fontSize: '0.8rem', background: 'var(--accent)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Beta</span>
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
                {/* Quick Links */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <Link href="/revisions/today" style={{ textDecoration: 'none' }}>
                        <div style={{ background: '#334155', padding: '0.7rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #475569' }}>
                            <span>📅</span> 今日の業績修正
                        </div>
                    </Link>
                    <Link href="/revisions/this-week" style={{ textDecoration: 'none' }}>
                        <div style={{ background: '#334155', padding: '0.7rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #475569' }}>
                            <span>🗓️</span> 今週の業績修正
                        </div>
                    </Link>
                    <Link href="/revisions/this-month" style={{ textDecoration: 'none' }}>
                        <div style={{ background: '#334155', padding: '0.7rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #475569' }}>
                            <span>🗓️</span> 今月の業績修正
                        </div>
                    </Link>
                </div>
            </header>

            {/* Category Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button onClick={() => setCategory('earnings')} style={{ padding: '0.6rem 1.2rem', borderRadius: '20px', background: category === 'earnings' ? 'var(--accent)' : '#334155', color: category === 'earnings' ? '#000' : '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>業績修正</button>
                <button onClick={() => setCategory('dividend')} style={{ padding: '0.6rem 1.2rem', borderRadius: '20px', background: category === 'dividend' ? 'var(--accent)' : '#334155', color: category === 'dividend' ? '#000' : '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>配当修正</button>
                <button onClick={() => setCategory('buyback')} style={{ padding: '0.6rem 1.2rem', borderRadius: '20px', background: category === 'buyback' ? 'var(--accent)' : '#334155', color: category === 'buyback' ? '#000' : '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>自社株買い</button>
                <button onClick={() => setCategory('all')} style={{ padding: '0.6rem 1.2rem', borderRadius: '20px', background: category === 'all' ? 'var(--accent)' : '#334155', color: category === 'all' ? '#000' : '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>すべて</button>
            </div>

            {/* Search Bar */}
            <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto', position: 'relative' }}>
                <input type="text" placeholder="銘柄コードまたは社名で検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '1rem 1.2rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '30px', color: '#fff', fontSize: '1rem', outline: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
            </div>

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
                        {validRevisions.map((rev) => {
                            // Display Logic based on Tab
                            let displayMode = category === 'all' ? (rev.category || 'earnings') : category;

                            // Force 'both' display style if the item is 'both', regardless of the tab
                            if (rev.category === 'both') {
                                displayMode = 'both';
                            }
                            // If DB category is null/unknown (fallback)
                            else if (category === 'all' && !rev.category) {
                                if (rev.dividend_forecast_annual) displayMode = 'dividend';
                                else displayMode = 'earnings';
                            }

                            let badgeLabel = '―';
                            let badgeClass = 'neutral';
                            let valueDisplay = null;

                            // Priority: Check AI Status
                            if (rev.ai_analyzed === 0) {
                                badgeLabel = '⏳ 解析待ち';
                                badgeClass = 'neutral';
                            } else if (rev.ai_analyzed === 2) {
                                badgeLabel = '⚠️ 解析エラー';
                                badgeClass = 'down'; // Warn user
                            }
                            // Buyback Display
                            else if (displayMode === 'buyback') {
                                badgeClass = 'up';
                                badgeLabel = '🚀 自社株買い';
                            }
                            // Dividend Display
                            else if (displayMode === 'dividend') {
                                // Dividend Mode
                                if (rev.is_dividend_hike === 1) {
                                    badgeClass = 'up';
                                    badgeLabel = '💰 増配';
                                } else if (rev.is_dividend_hike === -1) {
                                    badgeClass = 'down'; // Uses .down styling (usually red or blue depending on CSS, assumes blue/neg)
                                    badgeLabel = '📉 減配';
                                } else {
                                    badgeClass = 'neutral';
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
                            // Both (Earnings + Dividend)
                            else if (displayMode === 'both') {
                                const isHike = rev.is_dividend_hike === 1;
                                const isDecrease = rev.is_dividend_hike === -1;

                                if (isDecrease) {
                                    badgeClass = 'down'; // Or custom color? Using 'down' (usually red/blue context)
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
                            // Earnings Display (Default)
                            else {
                                const rate = rev.revision_rate_op;
                                const isZero = !rate || rate === 0;

                                if (isZero) {
                                    // If rate is missing/zero, do NOT show Up/Down label unless we are sure
                                    badgeClass = 'neutral';
                                    badgeLabel = '修正';
                                } else {
                                    const type = rev.is_upward === 1 ? 'up' : rev.is_upward === 0 ? 'down' : 'neutral';
                                    badgeClass = type;
                                    // Only show Up/Down if we have a rate
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
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {rev.source_url ? (
                                                <a href={rev.source_url} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
                                                    📄 PDF
                                                </a>
                                            ) : '-'}
                                        </div>
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
                                    表示できるデータがありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </main >
    );
}
