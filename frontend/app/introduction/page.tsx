import Link from 'next/link';
import { getInvestors } from '@/lib/db';
import { Investor } from '@/lib/types';
import AdSenseDisplay from '../../components/ads/AdSenseDisplay';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: '著名投資家紹介 | 億り人・決算速報',
    description: '五月、テスタ、井村俊哉など、市場で注目される大口投資家の動向とプロフィール。',
    openGraph: {
        title: '著名投資家の動向 | 億り人・決算速報',
        description: '「あの人は今何を買っている？」大口投資家の最新動向をチェック。',
        images: [{ url: 'https://rich-investor-news.com/api/og.png?type=investors', width: 1200, height: 630 }],
    },
    twitter: {
        card: 'summary_large_image',
        images: [{ url: 'https://rich-investor-news.com/api/og.png?type=investors', width: 1200, height: 630 }],
    },
};


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

            {/* Bottom Ad */}
            <div style={{ marginTop: '3rem' }}>
                <AdSenseDisplay slotId="6065455983" format="auto" responsive={true} />
            </div>
        </div>
    );
}
