import db from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function getShareholderHoldings(name: string) {
    try {
        const stmt = db.prepare(`
            SELECT s.ticker, s.share_ratio, s.share_count, s.rank, c.name as company_name 
            FROM stock_shareholders s
            LEFT JOIN companies c ON s.ticker = c.ticker
            WHERE s.shareholder_name LIKE ? 
            ORDER BY s.share_ratio DESC
        `);
        const rows = stmt.all(`%${name}%`);
        
        // Deduplicate by ticker, keeping the highest ratio (since there might be multiple entry dates)
        const uniqueHoldings = new Map();
        for (const r of rows as any[]) {
            if (!uniqueHoldings.has(r.ticker)) {
                uniqueHoldings.set(r.ticker, r);
            }
        }
        return Array.from(uniqueHoldings.values());
    } catch (e) {
        console.error("Error fetching shareholder holdings", e);
        return [];
    }
}

type Props = {
    params: Promise<{ name: string }>;
}

export default async function ShareholderPage({ params }: Props) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    
    const holdings = getShareholderHoldings(decodedName);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#f8fafc', borderBottom: '2px solid #334155', paddingBottom: '0.5rem' }}>
                「{decodedName}」の保有銘柄一覧
            </h1>
            
            {holdings.length === 0 ? (
                <div style={{ background: '#1e293b', padding: '2rem', textAlign: 'center', borderRadius: '8px', color: '#94a3b8' }}>
                    データが見つかりませんでした。
                </div>
            ) : (
                <div style={{ background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#334155', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>銘柄</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>持株比率</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>保有株数</th>
                            </tr>
                        </thead>
                        <tbody>
                            {holdings.map((h: any, idx: number) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s', cursor: 'pointer' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <Link href={`/stocks/${h.ticker}`} style={{ textDecoration: 'none', display: 'block' }}>
                                            <div style={{ color: '#fff', fontWeight: 'bold' }}>{h.company_name || h.ticker}</div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{h.ticker}</div>
                                        </Link>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#fbbf24', fontWeight: 'bold' }}>
                                        {h.share_ratio.toFixed(2)}%
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#cbd5e1' }}>
                                        {h.share_count}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
