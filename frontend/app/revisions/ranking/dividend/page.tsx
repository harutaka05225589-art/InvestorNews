import React from 'react';
import Link from 'next/link';
import styles from '../../revisions.module.css';
import db from '@/lib/db';

interface Revision {
    id: number;
    ticker: string;
    company_name: string;
    revision_date: string;
    dividend_forecast_annual: number;
    dividend_forecast_previous: number;
    ai_summary?: string;
}

// Metadata for SEO
export const metadata = {
    title: '配当増額（増配額）ランキング - Investor News',
    description: '上場企業の配当予想引き上げ額が大きい順にランキング。インカムゲイン狙いの投資家必見の最新増配銘柄リスト。',
    alternates: {
        canonical: '/revisions/ranking/dividend',
    },
};

async function getRankingData() {
    // Get top 50 dividend hikes (absolute increase amount) in the last 180 days
    const stmt = db.prepare(`
        SELECT id, ticker, company_name, revision_date, dividend_forecast_annual, dividend_forecast_previous, ai_summary
        FROM revisions
        WHERE is_dividend_hike = 1 
          AND dividend_forecast_annual IS NOT NULL 
          AND dividend_forecast_previous IS NOT NULL
          AND revision_date > date('now', '-180 days')
        ORDER BY (dividend_forecast_annual - dividend_forecast_previous) DESC
        LIMIT 50
    `);
    return stmt.all() as Revision[];
}

export default async function DividendRankingPage() {
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
                            { "@type": "ListItem", "position": 3, "name": "増配ランキング", "item": "https://rich-investor-news.com/revisions/ranking/dividend" }
                        ]
                    })
                }}
            />
            {/* JSON-LD for SEO */}
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
                            "name": `${rev.ticker} ${rev.company_name} - 追加配当 +${(rev.dividend_forecast_annual - rev.dividend_forecast_previous).toFixed(1)}円`
                        }))
                    })
                }}
            />
            <header className={styles.header}>
                <h1 className={styles.title}>
                    💰 配当増額ランキング（増配額順・直近180日）
                </h1>
                <p className={styles.subtitle}>
                    配当予想が大きく引き上げられた銘柄の一覧です。
                </p>
            </header>

            <section className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>順位</th>
                            <th>銘柄</th>
                            <th>増配額</th>
                            <th>発表日</th>
                            <th>新配当予想</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((rev, index) => {
                            const diff = rev.dividend_forecast_annual - rev.dividend_forecast_previous;
                            return (
                                <tr key={rev.id}>
                                    <td style={{ fontWeight: 'bold', color: index < 3 ? '#fbbf24' : 'inherit' }}>
                                        {index + 1}位
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 'bold' }}>{rev.ticker}</div>
                                        <Link href={`/stocks/${rev.ticker}`} style={{ fontSize: '0.85rem', color: '#60a5fa' }}>
                                            {rev.company_name}
                                        </Link>
                                    </td>
                                    <td style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                        +{diff.toFixed(1)}円
                                    </td>
                                    <td style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{rev.revision_date}</td>
                                    <td style={{ fontSize: '0.95rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>{rev.dividend_forecast_annual}円</span>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                                            (従来: {rev.dividend_forecast_previous}円)
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
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
