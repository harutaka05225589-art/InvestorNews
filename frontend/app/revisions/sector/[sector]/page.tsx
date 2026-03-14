import { getRevisionsByDateRange } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = {
    params: Promise<{ sector: string }>;
};

const SECTOR_LABELS: Record<string, string> = {
    'fishery': '水産・農林業',
    'mining': '鉱業',
    'construction': '建設業',
    'foods': '食料品',
    'textiles': '繊維製品',
    'pulp': 'パルプ・紙',
    'chemicals': '化学',
    'pharma': '医薬品',
    'oil': '石油・石炭製品',
    'rubber': 'ゴム製品',
    'glass': 'ガラス・土石製品',
    'steel': '鉄鋼',
    'nonferrous': '非鉄金属',
    'metal': '金属製品',
    'machinery': '機械',
    'electric': '電気機器',
    'transport': '輸送用機器',
    'precision': '精密機器',
    'other-products': 'その他製品',
    'energy': '電気・ガス業',
    'land-transport': '陸運業',
    'marine-transport': '海運業',
    'air-transport': '空運業',
    'warehousing': '倉庫・運輸関連業',
    'info-telecom': '情報・通信業',
    'wholesale': '卸売業',
    'retail': '小売業',
    'banking': '銀行業',
    'securities': '証券、商品先物取引業',
    'insurance': '保険業',
    'other-finance': 'その他金融業',
    'real-estate': '不動産業',
    'services': 'サービス業',
};

// Internal map for DB queries (Japanese names from DB)
const SLUG_TO_DB_NAME: Record<string, string> = {
    'info-telecom': '情報・通信業',
    'services': 'サービス業',
    'retail': '小売業',
    'wholesale': '卸売業',
    'machinery': '機械',
    'electric': '電気機器',
    'construction': '建設業',
    'pharma': '医薬品',
    'chemicals': '化学',
    'foods': '食料品',
    'real-estate': '不動産業',
    'banking': '銀行業',
    'land-transport': '陸運業',
    'other-products': 'その他製品',
    'precision': '精密機器',
    'metal': '金属製品',
    'textiles': '繊維製品',
    'glass': 'ガラス・土石製品',
    'nonferrous': '非鉄金属',
    'steel': '鉄鋼',
    'transport': '輸送用機器',
    'energy': '電気・ガス業',
    'marine-transport': '海運業',
    'air-transport': '空運業',
    'warehousing': '倉庫・運輸関連業',
    'pulp': 'パルプ・紙',
    'oil': '石油・石炭製品',
    'rubber': 'ゴム製品',
    'mining': '鉱業',
    'fishery': '水産・農林業',
    'securities': '証券、商品先物取引業',
    'insurance': '保険業',
    'other-finance': 'その他金融業',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { sector: slug } = await params;
    const sectorName = SECTOR_LABELS[slug];

    if (!sectorName) return { title: 'Sector Not Found' };

    const title = `${sectorName}の業績修正・決算速報一覧｜AI要約と株価影響`;
    const description = `${sectorName}セクターの上場企業による最新の業績上方修正、下方修正、増配発表を一覧で表示。AIが適時開示を解析し、修正の背景をわかりやすく要約します。`;

    return {
        title: `${title} | 億り人・決算速報`,
        description,
        alternates: {
            canonical: `https://rich-investor-news.com/revisions/sector/${slug}`,
        }
    };
}

export default async function SectorRevisionsPage({ params }: Props) {
    const { sector: slug } = await params;
    const dbSectorName = SLUG_TO_DB_NAME[slug];

    if (!dbSectorName) return notFound();

    // Fetch last 90 days of revisions for this sector
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const revisions = getRevisionsByDateRange(startDate, endDate, 'all', dbSectorName);

    return (
        <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
            {/* Breadcrumbs JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            { "@type": "ListItem", "position": 1, "name": "ホーム", "item": "https://rich-investor-news.com" },
                            { "@type": "ListItem", "position": 2, "name": "業績修正一覧", "item": "https://rich-investor-news.com/revisions" },
                            { "@type": "ListItem", "position": 3, "name": dbSectorName }
                        ]
                    })
                }}
            />

            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f8fafc', borderBottom: '2px solid var(--accent)', paddingBottom: '0.5rem' }}>
                {dbSectorName}の業績修正・決算速報
            </h1>

            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6' }}>
                {dbSectorName}セクターに属する企業の直近90日間の業績修正・配当修正・自社株買い発表をまとめています。
                AIがTDnetの適時開示資料を解析し、修正の理由を要約しています。
            </p>

            {revisions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>直近90日間、{dbSectorName}での業績修正発表はありませんでした。</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {revisions.map((rev: any) => (
                        <Link href={`/revisions/${rev.id}`} key={rev.id} style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: '#1e293b',
                                borderRadius: '12px',
                                border: '1px solid #334155',
                                padding: '1.5rem',
                                height: '100%',
                                transition: 'transform 0.2s, border-color 0.2s',
                                position: 'relative'
                            }} className="hover:border-accent">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{new Date(rev.revision_date).toLocaleDateString()}</span>
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        fontWeight: 'bold', 
                                        padding: '0.2rem 0.6rem', 
                                        borderRadius: '4px',
                                        background: rev.is_upward ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: rev.is_upward ? '#4ade80' : '#f87171'
                                    }}>
                                        {rev.is_upward ? '上方' : '下方'}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#f8fafc' }}>
                                    {rev.company_name} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>({rev.ticker})</span>
                                </h3>
                                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', height: '4.5rem', overflow: 'hidden', maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}>
                                    {rev.ai_summary || rev.title}
                                </div>
                                <div style={{ marginTop: '1rem', textAlign: 'right', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    理由を読む &rarr;
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <div style={{ marginTop: '4rem', padding: '2rem', background: '#0f172a', borderRadius: '12px', border: '1px dashed #334155' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc' }}>他の業種から探す</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                    {Object.entries(SECTOR_LABELS).filter(([s]) => s !== slug).map(([s, label]) => (
                        <Link key={s} href={`/revisions/sector/${s}`} style={{
                            padding: '0.5rem 1rem',
                            background: '#1e293b',
                            borderRadius: '30px',
                            fontSize: '0.85rem',
                            color: '#94a3b8',
                            textDecoration: 'none',
                            border: '1px solid #334155'
                        }}>
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
