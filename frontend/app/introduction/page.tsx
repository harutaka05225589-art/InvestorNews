import Link from 'next/link';
import { getInvestors } from '@/lib/db';
import { Investor } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function IntroductionPage() {
    const investors = getInvestors() as Investor[];

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    投資家紹介
                </h1>
                <p style={{ color: 'var(--secondary)' }}>
                    本サイトで動向を追っている著名投資家の一覧です。
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '2rem'
            }}>
                {investors.map((investor) => (
                    <Link href={`/introduction/${investor.id}`} key={investor.id} style={{ textDecoration: 'none' }}>
                        <div className="card investor-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ width: '100%', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{investor.name}</h3>
                                <div style={{
                                    background: 'var(--card-hover)',
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    display: 'inline-block'
                                }}>
                                    {investor.style_type || '一般'}
                                </div>
                            </div>
                            <p style={{ color: 'var(--secondary)', fontSize: '0.95rem', lineHeight: '1.6', flex: 1 }}>
                                {investor.style_description}
                            </p>
                            <div style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                詳細プロフィールを見る &rarr;
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
