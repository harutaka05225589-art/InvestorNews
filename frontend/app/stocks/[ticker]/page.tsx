import { cookies } from 'next/headers';
import Link from 'next/link';
import { getRevisionsByTicker, getDividendHistory, getLatestDividend, getStockProfile, getFinancialStats, getShareholders, getPortfolioTransactions } from '@/lib/db';
import DividendChart from '@/components/DividendChart';
import FinancialChart from '@/components/FinancialChart';
import ShareholderList from '@/components/ShareholderList';

type Props = {
    params: Promise<{ ticker: string }>;
}

export default async function StockPage({ params }: Props) {
    const { ticker } = await params;
    const decodedTicker = decodeURIComponent(ticker).toUpperCase();

    // 0. Fetch User ID (Mock/Cookie)
    // TODO: Use actual auth
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('userId');
    const userId = userIdCookie ? parseInt(userIdCookie.value, 10) : 1;

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
    const transactions = getPortfolioTransactions(userId);
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
                    <span>ポートフォリオに戻る</span>
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
                        {companyName}
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
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                🏢 企業概要
                            </h3>
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
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                🤖 最新のAI業績評価
                                <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#94a3b8', marginLeft: 'auto' }}>
                                    {new Date(latestRevision.revision_date).toLocaleDateString()} 更新
                                </span>
                            </h3>

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
                                    {latestRevision.ai_summary_text || "AIによる要約は生成されていません。"}
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
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                🤖 最新のAI業績評価
                            </h3>
                            <p style={{ color: '#94a3b8' }}>直近の業績修正情報はありません。</p>
                        </div>
                    )}

                    {/* 3. Financial Charts (NEW) */}
                    <div style={{ marginBottom: '3rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📊 業績・財務推移
                        </h3>
                        {financialStats && financialStats.length > 0 ? (
                            <FinancialChart data={financialStats} ticker={decodedTicker} />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', background: '#334155', borderRadius: '8px', color: '#94a3b8' }}>
                                <p>財務データがまだ取得されていません。<br />次回の更新をお待ちください。</p>
                            </div>
                        )}
                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'right' }}>
                            データソース: 株探 / TDnet
                        </p>
                    </div>

                    {/* 4. Dividend History */}
                    {history && history.length > 0 ? (
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                💰 配当の推移 (5年)
                            </h3>
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
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        👥 大株主の推移
                    </h3>
                    <ShareholderList data={shareholders} />
                </div>
            </article>
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

