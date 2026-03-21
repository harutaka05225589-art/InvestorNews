import Link from 'next/link';
import { getTrendingVotes } from '@/lib/db';

export default async function TrendingVotes() {
    const trending = getTrendingVotes(5);

    if (!trending || trending.length === 0) {
        return null; // Don't show if there's no data
    }

    return (
        <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            border: '1px solid #334155',
            padding: '1.5rem',
            marginBottom: '2rem'
        }}>
            <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                🔥 いま強気の銘柄トップ5
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {trending.map((t, i) => (
                    <Link 
                        href={`/stocks/${t.ticker}`} 
                        key={t.ticker}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textDecoration: 'none',
                            padding: '0.8rem',
                            background: 'rgba(15, 23, 42, 0.4)',
                            borderRadius: '8px',
                            border: '1px solid rgba(51, 65, 85, 0.5)',
                            transition: 'background 0.2s'
                        }}
                        className="hover:bg-slate-800"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{
                                width: '24px',
                                height: '24px',
                                background: i === 0 ? '#fbbf24' : (i === 1 ? '#94a3b8' : (i === 2 ? '#b45309' : '#334155')),
                                color: '#fff',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                            }}>
                                {i + 1}
                            </span>
                            <div>
                                <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '1rem' }}>{t.ticker}</div>
                                <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                                    {t.name && t.name.length > 10 ? t.name.substring(0, 10) + '...' : (t.name || '名称不明')}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>📈</span>
                            <span style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '0.9rem' }}>{t.bull_count}票</span>
                        </div>
                    </Link>
                ))}
            </div>
            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>※直近7日間の集計</span>
            </div>
        </div>
    );
}
