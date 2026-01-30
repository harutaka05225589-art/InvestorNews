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
}

function getRevisionType(rev: Revision) {
    // 1. AI Analysis result (Priority)
    if (rev.ai_analyzed && rev.is_upward !== null && rev.is_upward !== undefined) {
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
    const [searchQuery, setSearchQuery] = useState(''); // Search State

    useEffect(() => {
        const fetchRevisions = () => {
            setLoading(true);
            const url = searchQuery ? `/api/revisions?q=${encodeURIComponent(searchQuery)}` : '/api/revisions';
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data.revisions) {
                        setRevisions(data.revisions);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        };

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchRevisions();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]); // Re-run when searchQuery changes

    return (
        <main className={styles.container}>
            {/* ... Header ... */}
            <header className={styles.header}>
                <h1 className={styles.title}>
                    📊 業績修正速報
                    <span style={{ fontSize: '0.8rem', background: 'var(--accent)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Beta</span>
                </h1>
                <p className={styles.subtitle}>
                    AIがPDFを自動解析し「上方修正」「下方修正」を判定します。修正理由も要約済み。
                </p>
                {/* ... Quick Links ... */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <Link href="/revisions/today" style={{ textDecoration: 'none' }}>
                        <div style={{ background: '#334155', padding: '0.7rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #475569' }}>
                            <span>📅</span> 今日の修正
                        </div>
                    </Link>
                    <Link href="/revisions/this-month" style={{ textDecoration: 'none' }}>
                        <div style={{ background: '#334155', padding: '0.7rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #475569' }}>
                            <span>🗓️</span> 今月の修正
                        </div>
                    </Link>
                    <Link href="/revisions/ranking" style={{ textDecoration: 'none' }}>
                        <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '0.7rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #b45309' }}>
                            <span>🏆</span> 爆上げランキング
                        </div>
                    </Link>
                </div>
            </header>

            {/* Search Bar */}
            <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto', position: 'relative' }}>
                <input
                    type="text"
                    placeholder="銘柄コードまたは社名で検索 (例: トヨタ, 7203)..."
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
                <div style={{ position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                    🔍
                </div>
            </div>

            <div className={styles.statsGrid}></div>

            <section>
                <h2 className={styles.sectionTitle}>修正開示一覧 (新着順)</h2>

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
                            {revisions.map((rev) => {
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
                                                <Link href={`/revisions?q=${rev.ticker}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <span style={{ fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: '#475569' }}
                                                        className={styles.companyLink}>
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
                                                <span className={`${styles.badge} ${styles[type]}`}>
                                                    {type === 'up' ? '↗ 上方修正' : type === 'down' ? '↘ 下方修正' : '―'}
                                                </span>
                                                {rate !== undefined && rate !== 0 && (
                                                    <span style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: 'bold',
                                                        color: rate > 0 ? '#4ade80' : '#f87171'
                                                    }}>
                                                        {rate > 0 ? '+' : ''}{rate}%
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Link href={`/revisions/${rev.id}`} style={{ textDecoration: 'none' }}>
                                                    <span style={{ background: '#334155', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                                                        詳細
                                                    </span>
                                                </Link>
                                                {rev.source_url ? (
                                                    <a href={rev.source_url} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
                                                        📄 PDF
                                                    </a>
                                                ) : null}
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

                            {!loading && revisions.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>
                                        表示できるデータがありません
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main >
    );
}
