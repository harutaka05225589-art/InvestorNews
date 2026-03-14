import { getSurpriseRevisions } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: '決算サプライズ銘柄ランキング｜極めて高い修正率・大幅上方修正銘柄',
        description: 'AIが検出した「決算サプライズ」銘柄を一覧化。業績修正率が10%を超える大幅上方修正や、市場予想を大きく上回る銘柄をリアルタイムでランキング形式で表示します。',
    };
}

export default async function SurpriseRankingPage() {
    const revisions = await getSurpriseRevisions(30);

    return (
        <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem' }}>
                🔥 決算サプライズ銘柄ランキング
            </h1>

            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6' }}>
                AIがPDFから抽出した「修正率（営業利益）」が10%以上の銘柄をランキング形式で表示しています。
                サプライズ決算は翌日の株価に大きな影響を与えることが多いため、素早いチェックが重要です。
            </p>

            {revisions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>現在、サプライズ基準を満たす銘柄はありません。</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {revisions.map((rev: any) => (
                        <Link href={`/revisions/${rev.id}`} key={rev.id} style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: '#1e293b',
                                borderRadius: '12px',
                                border: '1px solid #334155',
                                padding: '1.5rem',
                                height: '100%',
                                borderTop: '4px solid #ef4444',
                                transition: 'transform 0.2s',
                                position: 'relative'
                            }} className="hover:scale-[1.02]">
                                <div style={{ marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                        驚異の+{rev.revision_rate_op}%
                                    </span>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                        {rev.revision_date}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.8rem', color: '#f8fafc' }}>
                                    {rev.company_name} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>({rev.ticker})</span>
                                </h3>
                                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {rev.ai_summary || rev.title}
                                </div>
                                <div style={{ marginTop: '1.2rem', textAlign: 'right', color: '#60a5fa', fontSize: '0.85rem' }}>
                                    詳細・AI分析を確認 &rarr;
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
