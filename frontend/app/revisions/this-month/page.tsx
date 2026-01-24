"use client";

import React, { useState, useEffect } from 'react';
import styles from '../../revisions.module.css';

interface Revision {
    id: number;
    ticker: string;
    company_name: string;
    revision_date: string;
    source_url?: string;
    title?: string;
}

function getRevisionType(title: string | undefined) {
    if (!title) return 'neutral';
    if (title.includes('上方修正')) return 'up';
    if (title.includes('下方修正')) return 'down';
    return 'neutral';
}

export default function MonthRevisionsPage() {
    const [revisions, setRevisions] = useState<Revision[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/revisions?filter=month')
            .then(res => res.json())
            .then(data => {
                if (data.revisions) {
                    setRevisions(data.revisions);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

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
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</td>
                                </tr>
                            )}

                            {!loading && revisions.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>
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
