import { getHoldingsByShareholder, Shareholder } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = {
    params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    const title = `${decodedName}の保有銘柄一覧`;
    const description = `大株主「${decodedName}」が現在保有している上場株式のポートフォリオと保有比率を一覧で確認できます。`;
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

export default async function HolderPage({ params }: Props) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    // Fetch holdings from DB
    const holdings = getHoldingsByShareholder([decodedName]);

    if (!holdings || holdings.length === 0) {
        return (
            <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem', color: '#fff', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '1rem' }}>株主データが見つかりません</h1>
                <p>「{decodedName}」の保有銘柄データは現在のところ登録されていません。</p>
                <div style={{ marginTop: '2rem' }}>
                    <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>&larr; ホームに戻る</Link>
                </div>
            </div>
        );
    }

    // Sort by ratio descending
    const sortedHoldings = holdings.sort((a, b) => b.share_ratio - a.share_ratio);

    return (
        <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem', color: '#fff' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s'
                }}>
                    <span>&larr;</span>
                    <span>ホームに戻る</span>
                </Link>
            </div>

            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{decodedName}</h1>
                <p style={{ color: '#94a3b8' }}>が保有する上場銘柄ポートフォリオ一覧</p>
            </div>

            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ background: '#0f172a', color: '#cbd5e1', fontSize: '0.9rem', borderBottom: '1px solid #334155' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>銘柄名</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>コード</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>保有株数</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>保有比率</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>報告日</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedHoldings.map((h, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #334155', ':hover': { background: '#334155' } } as React.CSSProperties}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                        <Link href={`/stocks/${h.ticker}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>
                                            {h.company_name}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                        <Link href={`/stocks/${h.ticker}`} style={{ color: '#94a3b8', textDecoration: 'none' }}>
                                            {h.ticker}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#cbd5e1' }}>
                                        {Number(h.share_count.replace(/,/g, '')).toLocaleString()}株
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#fbbf24', fontWeight: 'bold' }}>
                                        {h.share_ratio.toFixed(2)}%
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '0.85rem' }}>
                                        {h.entry_date}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ background: '#0f172a', padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    ※ 最新の大株主提出状況に基づいています
                </div>
            </div>
        </div>
    );
}
