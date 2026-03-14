import { getEarningsThisWeek } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: '今週の決算予定｜日本株決算スケジュール',
        description: '日本株の今週の決算発表予定を一覧表示。決算予定企業、発表日、市場を簡単に確認できます。投資家必須のスケジュール管理に。',
    };
}

export default async function EarningsThisWeekPage() {
    const events = await getEarningsThisWeek();
    const BASE_URL = 'https://rich-investor-news.com';

    // Structured Data: Breadcrumb & Article
    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": BASE_URL },
                { "@type": "ListItem", "position": 2, "name": "今週の決算予定", "item": `${BASE_URL}/earnings-this-week` }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "今週の決算予定｜日本株決算スケジュール一覧",
            "description": "日本株の今週の決算発表予定企業を一覧表示しています。発表日や銘柄情報をリアルタイムで確認可能。",
            "image": `${BASE_URL}/og-image.png`,
            "author": { "@type": "Organization", "name": "億り人・決算速報 (RIN)" },
            "publisher": { "@type": "Organization", "name": "億り人・決算速報 (RIN)" },
            "datePublished": new Date().toISOString()
        }
    ];

    return (
        <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', borderBottom: '3px solid #10b981', paddingBottom: '0.5rem' }}>
                今週の決算予定｜日本株決算スケジュール
            </h1>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                このページでは、日本株の今週（月曜日から日曜日まで）の決算発表予定企業を一覧表示しています。
                決算発表前後で株価が大きく動くことが多いため、保有銘柄や注目銘柄のスケジュールを事前に確認しておくことが重要です。
            </div>

            {events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#1e293b', borderRadius: '12px', color: '#94a3b8' }}>
                    今週の決算発表予定はありません。
                </div>
            ) : (
                <div style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', fontSize: '0.9rem' }}>
                                <th style={{ padding: '1rem' }}>発表予定日</th>
                                <th style={{ padding: '1rem' }}>銘柄名 (コード)</th>
                                <th style={{ padding: '1rem' }}>市場</th>
                                <th style={{ padding: '1rem' }}>詳細リンク</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((ev: any, idx: number) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }} className="hover:bg-slate-800/50">
                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#f8fafc' }}>
                                        {ev.event_date}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Link href={`/stocks/${ev.ticker}`} style={{ color: '#60a5fa', fontWeight: 'bold', textDecoration: 'none' }}>
                                                {ev.company_name}
                                            </Link>
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({ev.ticker})</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#94a3b8' }}>
                                        {ev.market}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <Link href={`/stocks/${ev.ticker}`} style={{ textDecoration: 'none', color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                            銘柄詳細・前回の決算 &rarr;
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ marginTop: '3rem', borderLeft: '4px solid #10b981', paddingLeft: '1.5rem' }}>
                <h3 style={{ color: '#f8fafc', marginBottom: '1rem' }}>📌 決算発表時のチェックポイント</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.8' }}>
                    1. <strong>実績値とコンセンサスの乖離</strong>: 市場予想に対して実績が上回ったか（ポジティブサプライズ）が即座に反映されます。<br />
                    2. <strong>通期予想の修正</strong>: 決算内容そのものよりも、来期や今後の見通しが上方修正されるかが重要視されます。<br />
                    3. <strong>株主還元策の追加</strong>: 配当の増額や自社株買いが同時に発表されることが多く、株価上昇のトリガーとなります。
                </p>
            </div>
            
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Link href="/calendar" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 'bold' }}>
                    &laquo; 全体のIRカレンダーを表示する
                </Link>
            </div>
        </div>
    );
}
