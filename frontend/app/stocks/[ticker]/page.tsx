import { cookies } from 'next/headers';
import Link from 'next/link';
import { getRevisionsByTicker, getDividendHistory, getLatestDividend, getStockProfile, getFinancialStats, getShareholders, getPortfolioTransactions, getRelatedStocksBySector } from '@/lib/db';
import { getSession } from '@/lib/auth';
import DividendChart from '@/components/DividendChart';
import FinancialChart from '@/components/FinancialChart';
import ShareholderList from '@/components/ShareholderList';

export const dynamic = 'force-dynamic';

type Props = {
    params: Promise<{ ticker: string }>;
}

import type { Metadata } from 'next';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { ticker } = await params;

    // Crucial: Await cookies() to force Next.js to dynamically render this page 
    // instead of statically caching it during the build process.
    await cookies();

    const decodedTicker = decodeURIComponent(ticker).toUpperCase();
    const divInfo = getLatestDividend(decodedTicker);
    const companyName = divInfo?.companyName || decodedTicker;

    const title = `${companyName}（${decodedTicker}）の将来性・配当推移｜最新決算と株価への影響`;
    const description = `「${companyName}（${decodedTicker}）」の最新AI業績評価、配当推移（増配・減配）、主要株主の動向を一覧化。決算発表が株価に与える影響や、著名投資家の保有状況から将来性を分析します。`;
    const ogTitle = encodeURIComponent(title);
    const ogSubtitle = encodeURIComponent(description.substring(0, 40));
    const ogImageUrl = `https://rich-investor-news.com/og-image.png?title=${ogTitle}&subtitle=${ogSubtitle}&type=default`;

    return {
        title: `${title} | 億り人・決算速報`,
        description,
        openGraph: {
            title,
            description,
            images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImageUrl],
        },
    };
}

import AdSenseDisplay from '../../../components/ads/AdSenseDisplay';

export default async function StockPage({ params }: Props) {
    const { ticker } = await params;
    const decodedTicker = decodeURIComponent(ticker).toUpperCase();


    // 0. Fetch User ID
    const session = await getSession();
    const userId = session?.userId ? Number(session.userId) : (session?.id ? Number(session.id) : null);

    // 1. Fetch Basic Data
    const divInfo = getLatestDividend(decodedTicker);
    const companyName = divInfo.companyName || decodedTicker;

    // 2. Fetch Profile (Company Description)
    const profile = getStockProfile(decodedTicker);

    // 3. Fetch Latest AI Analysis (from Revisions)
    const latestRevisions = getRevisionsByTicker(decodedTicker, 1);
    const latestRevision = latestRevisions.length > 0 ? latestRevisions[0] : null;

    // 4. Fetch Dividend History
    const history = getDividendHistory(decodedTicker);

    // 5. Fetch Financial History
    const financialStats = getFinancialStats(decodedTicker);

    // 6. Fetch Shareholder History
    const shareholders = getShareholders(decodedTicker);

    // 7. Fetch Portfolio Holdings (NEW)
    const transactions = userId ? getPortfolioTransactions(userId) : [];
    const myTransactions = transactions.filter(t => t.ticker === decodedTicker);

    // Calculate Holdings
    let totalShares = 0;
    let totalInvested = 0;
    // Separate by account? For simple view, aggregate.
    // Or show breakdown. Let's show aggregate for now.

    myTransactions.forEach(t => {
        if (t.shares > 0) { // Buy
            totalShares += t.shares;
            totalInvested += t.shares * t.price;
        } else { // Sell
            const sold = Math.abs(t.shares);
            totalShares -= sold;
            // Reduce invested proportionally? Or FIFO?
            // Simple approach: Avg price stays same
            const avg = totalShares > 0 ? totalInvested / (totalShares + sold) : 0; // Pre-sell avg
            totalInvested = totalShares * avg;
        }
    });

    const avgPrice = totalShares > 0 ? totalInvested / totalShares : 0;
    const isHolder = totalShares > 0;

    return (
        <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem', color: '#fff' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/portfolio" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: '#334155', color: '#fff',
                    padding: '0.6rem 1.2rem', borderRadius: '8px',
                    textDecoration: 'none', fontWeight: 'bold',
                    transition: 'background 0.2s'
                }}>
                    <span>&larr;</span>
                    <span>ウォッチリストに戻る</span>
                </Link>
            </div>

            {/* My Holdings Card (Unified View) */}
            {isHolder && (
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: '12px',
                    border: '1px solid #3b82f6',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
                }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        💰 あなたの保有状況
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>保有株数</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{totalShares.toLocaleString()}株</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>平均取得単価</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>@{Math.round(avgPrice).toLocaleString()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>投資総額</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>¥{Math.round(totalInvested).toLocaleString()}</div>
                        </div>
                        {divInfo.amount > 0 && (
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>受取配当予想(年)</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4ade80' }}>
                                    ¥{Math.round(totalShares * divInfo.amount).toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <article style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden', minHeight: '300px' }}>
                {/* Header */}
                <div style={{ background: '#0f172a', padding: '2rem', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <span style={{
                            background: '#334155', color: '#fff', padding: '0.2rem 0.6rem',
                            borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'monospace'
                        }}>
                            {decodedTicker}
                        </span>
                        {profile?.sector && (
                            <span style={{
                                background: '#3b82f6', color: '#fff', padding: '0.2rem 0.6rem',
                                borderRadius: '4px', fontSize: '0.8rem'
                            }}>
                                {profile.sector}
                            </span>
                        )}
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                        {companyName} の業績評価・将来性まとめ
                        <a href={`https://finance.yahoo.co.jp/quote/${decodedTicker}.T`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '0.9rem', color: '#94a3b8', marginLeft: '1rem', textDecoration: 'none', border: '1px solid #334155', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            Yahoo! <span style={{ fontSize: '0.8rem' }}>↗</span>
                        </a>
                    </h1>
                </div>

                <div style={{ padding: '2rem' }}>
                    {/* 1. Company Profile */}
                    {profile?.description ? (
                        <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                🏢 {companyName}の基礎情報・企業概要
                            </h2>
                            <p style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
                                {profile.description}
                            </p>
                        </div>
                    ) : (
                        <div style={{ marginBottom: '3rem', padding: '1.5rem', background: '#334155', borderRadius: '8px' }}>
                            <p style={{ color: '#94a3b8' }}>
                                企業情報はまだ生成されていません。<br />
                                次回のデータ更新時に自動生成されます。
                            </p>
                        </div>
                    )}

                    {/* 2. Latest AI Analysis */}
                    {latestRevision ? (
                        <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                🤖 {companyName}の最新AI業績評価（上方修正・下方修正履歴）
                                <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#94a3b8', marginLeft: 'auto' }}>
                                    {new Date(latestRevision.revision_date).toLocaleDateString()} 更新
                                </span>
                            </h2>

                            <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155' }}>
                                {/* Rating Badge */}
                                <div style={{ marginBottom: '1rem' }}>
                                    {latestRevision.ai_rating && (
                                        <span style={{
                                            fontSize: '1.2rem', fontWeight: 'bold',
                                            color: latestRevision.ai_rating === 'S' || latestRevision.ai_rating === 'A' ? '#facc15' : '#fff',
                                            marginRight: '1rem'
                                        }}>
                                            評価: {latestRevision.ai_rating}
                                        </span>
                                    )}
                                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                        {latestRevision.title}
                                    </span>
                                </div>

                                {/* Summary */}
                                <p style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
                                    {latestRevision.ai_summary || "AIによる要約は生成されていません。"}
                                </p>

                                <div style={{ marginTop: '1rem' }}>
                                    <Link href={`/revisions/${latestRevision.id}`} style={{ color: '#60a5fa', fontSize: '0.9rem', textDecoration: 'none' }}>
                                        詳細レポートを見る &rarr;
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                🤖 {companyName}の最新AI業績評価
                            </h2>
                            <p style={{ color: '#94a3b8' }}>直近の業績修正情報はありません。</p>
                        </div>
                    )}

                    {/* 3. Financial Charts (NEW) */}
                    <div style={{ marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📊 業績・財務推移
                        </h2>
                        {financialStats && financialStats.length > 0 ? (
                            <FinancialChart data={financialStats} ticker={decodedTicker} />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', background: '#334155', borderRadius: '8px', color: '#94a3b8' }}>
                                <p>財務データがまだ取得されていません。<br />次回の更新をお待ちください。</p>
                            </div>
                        )}
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'right' }}>
                            データソース: TDnet / EDINET
                        </p>
                    </div>

                    {/* 4. Dividend History */}
                    {history && history.length > 0 ? (
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                💰 {companyName}の配当推移と利回り予測
                            </h2>
                            <DividendChart history={history} />
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'right' }}>
                                ※ 棒グラフの縞模様は「予想」を示します
                            </p>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            <p>表示できる配当履歴データがありません。</p>
                        </div>
                    )}
                </div>
            </article>

            {/* 5. Shareholder History (New) */}
            <article style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden', marginTop: '2rem' }}>
                <div style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        👥 {companyName}の主要株主・著名投資家の保有状況
                    </h2>
                    <ShareholderList data={shareholders} />
                </div>
            </article>

            {/* 6. SEO Internal Linking (Cross-linking for YMYL Cluster) */}
            {profile?.sector && (() => {
                const relatedStocks = getRelatedStocksBySector(profile.sector, decodedTicker, 6);

                return (
                    <article style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '2rem', marginTop: '2rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc' }}>
                            🔗 同業種（{profile.sector}）の関連銘柄・ライバル企業
                        </h2>
                        {(!relatedStocks || relatedStocks.length === 0) ? (
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>同業種データのAI解析を待機中です。（バックグラウンドでシステムが順次追加しています）</p>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                {relatedStocks.map(s => (
                                    <Link key={s.ticker} href={`/stocks/${s.ticker}`} style={{
                                        background: '#0f172a', border: '1px solid #475569',
                                        color: '#60a5fa', textDecoration: 'none',
                                        padding: '0.6rem 1rem', borderRadius: '6px',
                                        fontSize: '0.9rem', fontWeight: 'bold',
                                        transition: 'background 0.2s, border-color 0.2s',
                                        display: 'flex', alignItems: 'center', gap: '0.4rem'
                                    }}>
                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace' }}>{s.ticker}</span>
                                        <span>{s.company_name}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </article>
                );
            })()}

            {/* E-E-A-T Disclaimer */}
            <div style={{ marginTop: '2rem', padding: '1rem 1.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6' }}>
                <p><strong>【⚠️ 投資免責事項】</strong><br />当ページ（{companyName}の業績・将来性分析ページ）に掲載されているAI業績要約および配当、株主情報等の各種データは、証券取引所の適時開示情報（TDnet）や金融庁（EDINET）等に基づく情報提供のみを目的としており、特定の銘柄への投資勧誘、推奨、助言を行うものではありません。株式投資に関する最終的な決定は、ご自身の判断と責任において行ってください。</p>
            </div>

            {/* AdSense (Bottom of Page) */}
            <AdSenseDisplay slotId="6065455983" format="auto" responsive={true} style={{ marginTop: '2rem' }} />
        </div>
    );
}

// Client Component for Chart (Recharts works best in Client Components)
// But we are in a Server Component.
// We should create a separate client component file or misuse "use client" in a separate file.
// For simplicity in this edit, I will define a small client component in a separate file soon.
// wait, I can't write multiple files in replace_file_content.
// I will create `frontend/components/DividendChart.tsx` next.
// For now, I will modify this file to import it.

