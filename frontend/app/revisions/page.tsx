"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './revisions.module.css';

// Type definition
interface Revision {
    id: number;
    ticker: string;
    company_name: string;
    revision_date: string;
    description?: string;
    source_url?: string;
    title?: string;
}

// Helper to determine revision type
function getRevisionType(title: string | undefined) {
    if (!title) return 'neutral';
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
            <header className={styles.header}>
                <h1 className={styles.title}>
                    📊 業績修正速報
                    <span style={{ fontSize: '0.8rem', background: 'var(--accent)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Beta</span>
                </h1>
                <p className={styles.subtitle}>
                    TDnetからリアルタイムで「業績予想の修正」に関する開示情報を自動収集・一覧化しています。
                </p>

                {/* Quick Links */}
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
                        <div style={{ background: '#334155', padding: '0.7rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #475569' }}>
                            <span>🏆</span> ランキング
                        </div>
                    </Link>
                    <Link href="/plans" style={{ textDecoration: 'none' }}>
                        <div style={{ background: 'transparent', padding: '0.7rem 1.2rem', borderRadius: '6px', fontSize: '0.9rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px dashed #475569' }}>
                            <span>ℹ️</span> 機能プランについて
                        </div>
                    </Link>
                </div>
            </header>

            {/* Stats Overview (Mock for now) */}
            <div className={styles.statsGrid}>
                {/* ... existing stats ... */}
            </div>

            <section>
                <h2 className={styles.sectionTitle}>修正開示一覧 (新着順)</h2>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>日付</th>
                                <th>コード</th>
                                <th>銘柄名</th>
                                {/* <th>修正内容（種別）</th> */}
                                <th>開示詳細</th>
                            </tr>
                        </thead>
                        <tbody>
                            {revisions.map((rev) => {
                                const type = getRevisionType(rev.title);
                                return (
                                    <tr key={rev.id}>
                                        <td>{rev.revision_date}</td>
                                        <td>
                                            <a href={`https://finance.yahoo.co.jp/quote/${rev.ticker}.T`} target="_blank" rel="noopener noreferrer" className={styles.tickerLink}>
                                                {rev.ticker}
                                            </a>
                                        </td>
                                        <td>
                                            {rev.company_name}
                                            <span style={{ marginLeft: '0.5rem' }} className={`${styles.badge} ${styles[type]}`}>
                                                {type === 'up' ? '↗' : type === 'down' ? '↘' : ''}
                                            </span>
                                        </td>
                                        {/* 
                                        <td>
                                            <span className={`${styles.badge} ${styles[type]}`}>
                                                {type === 'up' ? '↗ 上方修正' : type === 'down' ? '↘ 下方修正' : '修正'}
                                            </span>
                                        </td> 
                                        */}
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
        </main>
    );
}
