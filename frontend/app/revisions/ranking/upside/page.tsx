import React from 'react';
import Link from 'next/link';
import styles from '../../revisions.module.css';
import db from '@/lib/db';

interface Revision {
    id: number;
    ticker: string;
    company_name: string;
    revision_date: string;
    revision_rate_op: number;
    ai_summary?: string;
}

// Metadata for SEO
export const metadata = {
    title: '業績上方修正率ランキング（直近90日） - Investor News',
    description: '直近90日間で営業利益の上方修正率が高かった銘柄をランキング形式で表示。AI要約で修正理由も一目瞭然。',
    alternates: {
        canonical: '/revisions/ranking/upside',
    },
};

async function getRankingData() {
    // Get top 50 upward revisions by rate in the last 90 days
    const stmt = db.prepare(`
        SELECT id, ticker, company_name, revision_date, revision_rate_op, ai_summary
        FROM revisions
        WHERE is_upward = 1 
          AND revision_rate_op IS NOT NULL 
          AND revision_rate_op > 0
          AND revision_date > date('now', '-90 days')
        ORDER BY revision_rate_op DESC
        LIMIT 50
    `);
    return stmt.all() as Revision[];
}

export default async function UpsideRankingPage() {
    const rankings = await getRankingData();

    return (
        <main className={styles.container}>
            {/* JSON-LD: Breadcrumbs */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            { "@type": "ListItem", "position": 1, "name": "ホーム", "item": "https://rich-investor-news.com/" },
                            { "@type": "ListItem", "position": 2, "name": "業績修正一覧", "item": "https://rich-investor-news.com/revisions" },
                            { "@type": "ListItem", "position": 3, "name": "上方修正ランキング", "item": "https://rich-investor-news.com/revisions/ranking/upside" }
                        ]
                    })
                }}
            />
            {/* JSON-LD: ItemList */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "itemListElement": rankings.map((rev, i) => ({
                            "@type": "ListItem",
                            "position": i + 1,
                            "url": `https://rich-investor-news.com/stocks/${rev.ticker}`,
                            "name": `${rev.ticker} ${rev.company_name} - 修正率 +${Number(rev.revision_rate_op).toFixed(1)}%`
                        }))
                    })
                }}
            />
            <header className={styles.header}>
                <h1 className={styles.title}>
                    🚀 業績上方修正率ランキング（直近90日）
                </h1>
                <p className={styles.subtitle}>
                    営業利益の修正率が高い順に銘柄をピックアップしています。
                </p>
            </header>

            <section className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>順位</th>
                            <th>銘柄</th>
                            <th>修正率</th>
                            <th>発表日</th>
                            <th>AI要約</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((rev, index) => (
                            <tr key={rev.id}>
                                <td style={{ fontWeight: 'bold', color: index < 3 ? 'var(--accent)' : 'inherit' }}>
                                    {index + 1}位
                                </td>
                                <td>
                                    <div style={{ fontWeight: 'bold' }}>{rev.ticker}</div>
                                    <Link href={`/stocks/${rev.ticker}`} style={{ fontSize: '0.85rem', color: '#60a5fa' }}>
                                        {rev.company_name}
                                    </Link>
                                </td>
                                <td style={{ color: 'var(--profit)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                    +{Number(rev.revision_rate_op).toFixed(1)}%
                                </td>
                                <td style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{rev.revision_date}</td>
                                <td style={{ fontSize: '0.85rem', maxWidth: '400px' }}>
                                    {rev.ai_summary || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Link href="/revisions" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                    &larr; 業績修正一覧に戻る
                </Link>
            </div>
        </main>
    );
}
