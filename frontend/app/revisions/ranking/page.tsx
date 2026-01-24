"use client";

import React, { useState, useEffect } from 'react';
import styles from '../revisions.module.css';

interface RevisionRanking {
    ticker: string;
    company_name: string;
    count: number;
}

export default function RevisionRankingPage() {
    const [ranking, setRanking] = useState<RevisionRanking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/revisions/ranking')
            .then(res => res.json())
            .then(data => {
                if (data.ranking) {
                    setRanking(data.ranking);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    🏆 業績修正ランキング
                </h1>
                <p className={styles.subtitle}>
                    修正回数の多い「積極開示」または「変動の大きい」銘柄ランキングです（全期間）。
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
                                <th>順位</th>
                                <th>コード</th>
                                <th>銘柄名</th>
                                <th>修正回数</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking.map((item, index) => (
                                <tr key={item.ticker}>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '24px', height: '24px',
                                            background: index < 3 ? '#fbbf24' : '#334155',
                                            color: index < 3 ? '#000' : '#fff',
                                            borderRadius: '50%', textAlign: 'center', lineHeight: '24px',
                                            fontWeight: 'bold'
                                        }}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td>
                                        <a href={`https://finance.yahoo.co.jp/quote/${item.ticker}.T`} target="_blank" rel="noopener noreferrer" className={styles.tickerLink}>
                                            {item.ticker}
                                        </a>
                                    </td>
                                    <td>{item.company_name}</td>
                                    <td style={{ fontWeight: 'bold' }}>{item.count}回</td>
                                </tr>
                            ))}

                            {loading && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
