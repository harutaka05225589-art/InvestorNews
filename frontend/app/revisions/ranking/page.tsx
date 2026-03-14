import React from 'react';
import Link from 'next/link';
import styles from '../revisions.module.css';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getWeeklyRanking() {
    // Get top 20 by revision rate op in last 7 days
    try {
        const stmt = db.prepare(`
            SELECT r.ticker, r.company_name as name, r.revision_rate_op as change_pct
            FROM revisions r
            WHERE r.revision_date > date('now', '-7 days')
              AND r.revision_rate_op IS NOT NULL
            ORDER BY r.revision_rate_op DESC
            LIMIT 20
        `);
        return stmt.all() as any[];
    } catch (e) {
        return [];
    }
}

export default async function RevisionRankingPage() {
    const ranking = await getWeeklyRanking();
    const updatedAt = new Date().toLocaleDateString();

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    🏆 今週の業績修正率ランキング
                </h1>
                <p className={styles.subtitle}>
                    今週、<strong>営業利益の上方修正率が高かった銘柄</strong>のトップ20です。
                    <br />
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>更新: {updatedAt} (リアルタイム更新)</span>
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link href="/revisions" style={{ fontSize: '0.9rem', color: 'var(--accent)', textDecoration: 'underline' }}>
                        &larr; 修正一覧に戻る
                    </Link>
                </div>
            </header>

            <section>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                    <Link href="/revisions/ranking/surprise" style={{ padding: '1.5rem', background: '#1e293b', border: '1px solid #ef4444', borderRadius: '12px', textDecoration: 'none' }}>
                        <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '0.5rem' }}>🔥 決算サプライズ</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>修正率10%以上の銘柄</div>
                    </Link>
                    <Link href="/revisions/ranking/hot" style={{ padding: '1.5rem', background: '#1e293b', border: '1px solid #3b82f6', borderRadius: '12px', textDecoration: 'none' }}>
                        <div style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '0.5rem' }}>⚡ 急騰・注目銘柄</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>開示頻度の高い活発な銘柄</div>
                    </Link>
                    <Link href="/revision-rate-ranking" style={{ padding: '1.5rem', background: '#1e293b', border: '1px solid #6366f1', borderRadius: '12px', textDecoration: 'none' }}>
                        <div style={{ color: '#6366f1', fontWeight: 'bold', marginBottom: '0.5rem' }}>📊 修正率ランキング</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>大幅な上方・下方修正</div>
                    </Link>
                    <Link href="/earnings-this-week" style={{ padding: '1.5rem', background: '#1e293b', border: '1px solid #10b981', borderRadius: '12px', textDecoration: 'none' }}>
                        <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '0.5rem' }}>📅 今週の決算予定</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>最新のIRスケジュール</div>
                    </Link>
                    <Link href="/investor-buying" style={{ padding: '1.5rem', background: '#1e293b', border: '1px solid #fb7185', borderRadius: '12px', textDecoration: 'none' }}>
                        <div style={{ color: '#fb7185', fontWeight: 'bold', marginBottom: '0.5rem' }}>👤 投資家買い増し</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>著名投資家の最新動向</div>
                    </Link>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>順位</th>
                                <th>コード</th>
                                <th>銘柄名</th>
                                <th>修正率</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking.map((item, index) => (
                                <tr key={item.ticker}>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '28px', height: '28px',
                                            background: (index + 1) <= 3 ? '#fbbf24' : '#334155',
                                            color: (index + 1) <= 3 ? '#000' : '#fff',
                                            borderRadius: '50%', textAlign: 'center', lineHeight: '28px',
                                            fontWeight: 'bold'
                                        }}>
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td>
                                        <Link href={`/stocks/${item.ticker}`} className={styles.tickerLink} style={{ color: '#60a5fa', fontWeight: 'bold', textDecoration: 'none' }}>
                                            {item.ticker}
                                        </Link>
                                    </td>
                                    <td>{item.name}</td>
                                    <td style={{ fontWeight: 'bold', color: item.change_pct > 0 ? '#4ade80' : '#f87171' }}>
                                        {item.change_pct > 0 ? '+' : ''}{Number(item.change_pct).toFixed(2)}%
                                    </td>
                                </tr>
                            ))}

                            {ranking.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                                        直近1週間の業績修正データはありません。
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
