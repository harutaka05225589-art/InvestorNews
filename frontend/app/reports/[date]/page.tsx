import { getDailyReport, getRecentReports } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { remark } from 'remark';
import html from 'remark-html';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { date: string } }): Promise<Metadata> {
    const report = getDailyReport(params.date);
    if (!report) return { title: 'Not Found' };

    return {
        title: `${report.title}｜億り人・決算速報`,
        description: `${params.date}の日本株市場をAIが総括。上方修正や増配など、株価を動かす重要な適時開示情報とその背景を詳しく解説します。`,
        openGraph: {
            images: [`https://rich-investor-news.com/og-image.png?title=${encodeURIComponent(report.title)}&type=default`],
        }
    };
}

export default async function DailyReportPage({ params }: { params: { date: string } }) {
    const report = getDailyReport(params.date);
    
    if (!report) {
        notFound();
    }

    // Convert markdown to HTML securely
    const processedContent = await remark().use(html).process(report.content_md);
    const contentHtml = processedContent.toString();

    // Fetch related/recent reports for sidebar
    const recent = getRecentReports(5).filter(r => r.date_str !== params.date);
    const BASE_URL = 'https://rich-investor-news.com';

    // NewsArticle Structured Data
    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": report.title,
            "image": [`${BASE_URL}/og-image.png?title=${encodeURIComponent(report.title)}&type=default`],
            "datePublished": `${report.date_str}T15:00:00+09:00`,
            "dateModified": report.created_at,
            "author": [{ "@type": "Organization", "name": "億り人・決算速報 (RIN)", "url": BASE_URL }]
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "ホーム", "item": BASE_URL },
                { "@type": "ListItem", "position": 2, "name": "相場まとめレポート", "item": `${BASE_URL}/reports` },
                { "@type": "ListItem", "position": 3, "name": report.title, "item": `${BASE_URL}/reports/${report.date_str}` }
            ]
        }
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <main style={{ flex: '1 1 700px', background: '#0f172a', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' }}>
                <header style={{ borderBottom: '1px solid #334155', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        📅 {report.date_str}
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc', lineHeight: 1.4 }}>
                        {report.title}
                    </h1>
                </header>

                <article 
                    style={{ lineHeight: '2', color: '#cbd5e1', fontSize: '1.05rem', wordBreak: 'break-word' }}
                    dangerouslySetInnerHTML={{ __html: contentHtml }} 
                />
            </main>

            <aside style={{ flex: '1 1 300px' }}>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', position: 'sticky', top: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#60a5fa', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                        📝 最新の相場レポート
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {recent.map((r: any) => (
                            <li key={r.id} style={{ marginBottom: '1rem' }}>
                                <Link href={`/reports/${r.date_str}`} style={{ textDecoration: 'none', display: 'block' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.date_str}</div>
                                    <div style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 'bold', lineHeight: 1.4 }}>{r.title}</div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                         <Link href="/reports" style={{ color: '#fbbf24', fontSize: '0.9rem', textDecoration: 'none' }}>
                            過去のレポート一覧へ &rarr;
                         </Link>
                    </div>
                </div>
            </aside>
        </div>
    );
}
