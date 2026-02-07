import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getRevisionsByTicker, getDividendHistory, getLatestDividend } from '@/lib/db';
import DividendChart from '@/components/DividendChart';

type Props = {
    params: Promise<{ ticker: string }>;
}

export default async function StockPage({ params }: Props) {
    const { ticker } = await params;
    const decodedTicker = decodeURIComponent(ticker).toUpperCase();

    // 1. Try to find the latest revision
    // Fetch 1 latest revision
    const revisions = getRevisionsByTicker(decodedTicker, 1);

    if (revisions && revisions.length > 0) {
        // Redirect to the latest revision page
        const latestId = revisions[0].id; // id is string or number? db helper usually returns basic types.
        redirect(`/revisions/${latestId}`);
    }

    // 2. If no revision found, Fallback: Show Dividend History
    // Get Company Name
    const divInfo = getLatestDividend(decodedTicker);
    const companyName = divInfo.companyName || decodedTicker;

    // Get History
    const history = getDividendHistory(decodedTicker);
    // history object: { period: string, dividend_amount: number, is_forecast: number }

    return (
        <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1.5rem', color: '#fff' }}>
            <Link href="/portfolio" style={{ color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
                &larr; ポートフォリオに戻る
            </Link>

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
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                        {companyName}
                    </h1>
                    <p style={{ color: '#94a3b8' }}>直近の業績修正情報はありませんが、過去の配当履歴を表示します。</p>
                </div>

                <div style={{ padding: '2rem' }}>
                    {history && history.length > 0 ? (
                        <div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', borderBottom: '2px solid #334155', paddingBottom: '0.5rem' }}>
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

