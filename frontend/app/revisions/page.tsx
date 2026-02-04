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
    is_dividend_hike?: number; // Added
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

export default function RevisionsPage() {
    const [revisions, setRevisions] = useState<Revision[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('earnings'); // Default to Earnings as requested

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

    // Filter Logic to remove "No Change" / "Noise"
    const validRevisions = revisions.filter(rev => {
        // If AI Analyzed
        if (rev.ai_analyzed === 1) {
            // Keep if Upward (True)
            if (rev.is_upward === 1) return true;
            // Keep if Dividend Hike
            if (rev.is_dividend_hike === 1) return true;
            // Keep if Downward (False) AND Rate is not 0 (Significant Downward)
            if (rev.is_upward === 0 && rev.revision_rate_op && rev.revision_rate_op !== 0) return true;

            // Otherwise it's "Neutral" (No change), Skip it.
            return false;
        }

        // If Not Analyzed (or Failed/Skipped), fallback to title check
        // Show everything when searching
        if (searchQuery) return true;

        // Filter based on title keywords if unanalyzed
        // We want to avoid generic 'Financial Results' showing up unless they have revision keywords
        // But for now, let's be permissive with unanalyzed items to avoid hiding real news.
        return true;
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
                <button
                    onClick={() => setCategory('earnings')}
                    style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: '20px',
                        background: category === 'earnings' ? 'var(--accent)' : '#334155',
                        color: category === 'earnings' ? '#000' : '#fff',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    業績修正
                </button>
                <button
                    onClick={() => setCategory('dividend')}
                    style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: '20px',
                        background: category === 'dividend' ? 'var(--accent)' : '#334155',
                        color: category === 'dividend' ? '#000' : '#fff',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    配当修正
                </button>
                <button
                    onClick={() => setCategory('buyback')}
                    style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: '20px',
                        background: category === 'buyback' ? 'var(--accent)' : '#334155',
                        color: category === 'buyback' ? '#000' : '#fff',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    自社株買い
                </button>
                <button
                    onClick={() => setCategory('all')}
                    style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: '20px',
                        background: category === 'all' ? 'var(--accent)' : '#334155',
                        color: category === 'all' ? '#000' : '#fff',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    すべて
                </button>
            </div>

            {/* Search Bar */}
            <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto', position: 'relative' }}>
                <input
                    type="text"
                    placeholder="銘柄コードまたは社名で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '1rem 1.2rem',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '30px',
                        color: '#fff',
                        fontSize: '1rem',
                        outline: 'none',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                />
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
                            const type = getRevisionType(rev);
                            const rate = rev.revision_rate_op;

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
                                                <span style={{ fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: '#475569' }}
                                                    className={styles.companyLink}>
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
                                            <span className={`${styles.badge} ${styles[type]}`}>
                                                {type === 'up' ? '↗ 上方修正' : type === 'down' ? '↘ 下方修正' : type === 'neutral' ? '― 修正なし' : '―'}
                                            </span>
                                            {rate !== undefined && rate !== null && rate !== 0 ? (
                                                <span style={{
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold',
                                                    color: rate > 0 ? '#4ade80' : '#f87171'
                                                }}>
                                                    {rate > 0 ? '+' : ''}{Number(rate).toFixed(2)}%
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>-</span>
                                            )}
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
        </main>
    );
}
