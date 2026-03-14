import { getHotTickers } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: '急騰・注目銘柄ランキング｜適時開示・業績修正の頻度が高い銘柄',
        description: '直近90日間で業績修正や適時開示の頻度が高い「動いている」銘柄をAIが自動抽出。投資家の注目が集まっている銘柄をいち早く把握できます。',
    };
}

export default async function HotRankingPage() {
    const tickers = await getHotTickers(30);

    return (
        <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem' }}>
                ⚡ 急騰・注目銘柄（高頻度修正）
            </h1>

            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6' }}>
                直近90日間で業績予想の修正を複数回行っている、または開示の動きが活発な銘柄を表示しています。
                頻繁な修正は業績の急激な変化を示唆しており、市場の注目度が高い銘柄群です。
            </p>

            {tickers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>現在、対象となる銘柄はありません。</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {tickers.map((t: any) => (
                        <Link href={`/stocks/${t.ticker}`} key={t.ticker} style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: '#1e293b',
                                borderRadius: '12px',
                                border: '1px solid #334155',
                                padding: '1.5rem',
                                height: '100%',
                                transition: 'transform 0.2s',
                                display: 'flex',
                                flexDirection: 'column'
                            }} className="hover:scale-[1.02]">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ background: '#3b82f6', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                        注目度 {t.activity_count}
                                    </span>
                                    {t.sector && (
                                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                            {t.sector}
                                        </span>
                                    )}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#f8fafc' }}>
                                    {t.company_name}
                                </h3>
                                <div style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '1rem' }}>
                                    証券コード: {t.ticker}
                                </div>
                                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #334155', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                    最終更新: {t.last_date}
                                </div>
                                <div style={{ marginTop: '0.8rem', textAlign: 'right', color: '#60a5fa', fontWeight: 'bold' }}>
                                    銘柄詳細・推移をみる &rarr;
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
