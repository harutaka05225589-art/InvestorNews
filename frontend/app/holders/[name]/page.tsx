import { getHoldingsByShareholder } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import AdSenseDisplay from '../../../components/ads/AdSenseDisplay';
import AdSenseInFeed from '../../../components/ads/AdSenseInFeed';

type Props = {
    params: Promise<{ name: string }>;
}

export default async function ShareholderPage({ params }: Props) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    if (!decodedName) {
        notFound();
    }

    const holdings = getHoldingsByShareholder(decodedName);

    // Calculate strict total value if we had price data, but we don't here easily.
    // Just count companies.
    const companyCount = holdings.length;

    // Calculate latest entry date
    const lastUpdated = holdings.length > 0
        ? holdings.reduce((max, h) => (h.entry_date > max ? h.entry_date : max), '')
        : null;

    return (
        <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem', color: '#fff' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem'
                }}>
                    <span>&larr;</span>
                    <span>ホームに戻る</span>
                </Link>
            </div>

            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #334155', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>👥</span>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                        {decodedName}
                        <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#94a3b8', marginLeft: '1rem' }}>
                            の保有銘柄
                        </span>
                    </h1>
                </div>
                <div style={{ marginLeft: '4rem' }}>
                    {lastUpdated && (
                        <p style={{ color: '#4ade80', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            最終更新日: {lastUpdated}
                        </p>
                    )}
                    <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                        大株主として記載されている銘柄の一覧です。<br />
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>※ 直近の有価証券報告書や決算短信に基づくデータです。現在の実際の保有状況とは異なる場合があります。</span>
                    </p>
                </div>
            </header>

            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>
                        保有銘柄リスト
                    </h2>
                    <span style={{ background: '#3b82f6', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {companyCount} 銘柄
                    </span>
                </div>

                {holdings.length > 0 ? (
                    <div className="overflow-x-auto md:overflow-visible w-full">
                        <table className="w-full min-w-[600px] md:min-w-0 text-sm" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#334155', color: '#cbd5e1' }}>
                                    <th className="p-2 text-left whitespace-nowrap">コード</th>
                                    <th className="p-2 text-left w-full">銘柄名</th>
                                    <th className="p-2 text-right whitespace-nowrap">保有比率</th>
                                    <th className="p-2 text-right whitespace-nowrap">保有株数</th>
                                    <th className="p-2 text-right whitespace-nowrap min-w-[100px]">報告日</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((h, i) => (
                                    <Fragment key={i}>
                                        <tr style={{ borderBottom: '1px solid #334155' }}>
                                            <td className="p-2 whitespace-nowrap">
                                                <Link href={`/stocks/${h.ticker}`} style={{ color: '#60a5fa', fontWeight: 'bold', textDecoration: 'none', fontFamily: 'monospace' }}>
                                                    {h.ticker}
                                                </Link>
                                            </td>
                                            <td className="p-2 font-bold break-words whitespace-normal">
                                                <Link href={`/stocks/${h.ticker}`} style={{ color: '#fff', textDecoration: 'none' }}>
                                                    {h.company_name}
                                                </Link>
                                            </td>
                                            <td className="p-2 text-right whitespace-nowrap">
                                                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                                                    {h.share_ratio.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="p-2 text-right text-slate-300 whitespace-nowrap">
                                                {h.share_count}
                                            </td>
                                            <td className="p-2 text-right text-slate-400 text-xs whitespace-nowrap">
                                                {h.entry_date}
                                            </td>
                                        </tr>
                                        {/* Insert Ad every 10 rows */}
                                        {(i + 1) % 10 === 0 && (
                                            <tr key={`ad-${i}`}>
                                                <td colSpan={5} style={{ padding: 0, background: 'transparent', border: 'none' }}>
                                                    <AdSenseInFeed
                                                        slotId="3072451399"
                                                        layoutKey="-fb+5w+4e-db+86"
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        <p>現在登録されている保有銘柄はありません。</p>
                    </div>
                )}
            </div>

            {/* AdSense (Bottom) */}
            <AdSenseDisplay slotId="6065455983" format="auto" responsive={true} style={{ marginTop: '3rem' }} />
        </div>
    );
}
