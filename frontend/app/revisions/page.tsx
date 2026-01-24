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

    useEffect(() => {
        fetch('/api/revisions')
            .then(res => res.json())
            .then(data => {
                if (data.revisions) {
                    setRevisions(data.revisions);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

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
                </div>
            </header>

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
                                                <span style={{ fontWeight: 600 }}>{rev.company_name}</span>
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
                                            {rev.source_url ? (
                                                <a href={rev.source_url} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
                                                    📄 PDF
                                                </a>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </section>
                    </main>
                    );
}
