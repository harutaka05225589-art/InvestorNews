import { getRevisionsByDateRange } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: '最新の自社株買い発表銘柄一覧・ランキング｜決算速報・AI要約',
    description: '日本株の最新の自社株買い（自己株式取得）発表をAIが要約。取得枠の大きさや目的、株価へのインパクトを瞬時に把握できます。増配と並ぶ重要な株主還元施策を確認しましょう。',
};

export default async function BuybackRankingPage() {
    // Fetch last 180 days of buybacks
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // category='buyback'
    const revisions = getRevisionsByDateRange(startDate, endDate, 'buyback');

    return (
        <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f8fafc', borderBottom: '2px solid #fbbf24', paddingBottom: '0.5rem' }}>
                💰 自社株買い（追加還元）銘柄一覧
            </h1>

            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6' }}>
                直近180日間に「自己株式の取得（自社株買い）」を発表した企業を一覧表示しています。
                自社株買いは、1株あたりの価値を高める代表的な株主還元施策です。AIが取得総額や期間などの要約を表示します。
            </p>

            {revisions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>現在、表示できる自社株買いの情報はありません。</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {revisions.map((rev: any) => (
                        <Link href={`/revisions/${rev.id}`} key={rev.id} style={{ textDecoration: 'none' }}>
                            <div style={{
                                borderRadius: '12px',
                                border: '1px solid #fbbf24',
                                padding: '1.5rem',
                                height: '100%',
                                transition: 'transform 0.2s',
                                background: 'linear-gradient(135deg, #1e293b 0%, #171f2e 100%)'
                            }} className="hover:scale-[1.02]">
                                <div style={{ marginBottom: '1rem', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>✨ 自社株買い発表</span>
                                    <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>• {new Date(rev.revision_date).toLocaleDateString()}</span>
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.8rem', color: '#f8fafc' }}>
                                    {rev.company_name} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>({rev.ticker})</span>
                                </h3>
                                <div style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                                    {rev.ai_summary || rev.title}
                                </div>
                                <div style={{ marginTop: '1.2rem', textAlign: 'right', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    詳細・IR資料を確認 &rarr;
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
