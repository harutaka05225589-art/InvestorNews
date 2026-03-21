import { getRecentReports } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: '相場まとめレポート一覧｜本日の日本株（上方修正・増配）｜億り人・決算速報',
        description: '毎日夕方に更新！本日の日本株市場で注目を集めた業績修正（上方修正や増配）をAIが総括・解説するレポートの一覧ページです。',
    };
}

export default async function DailyReportsIndexPage() {
    const reports = getRecentReports(50);
    const BASE_URL = 'https://rich-investor-news.com';

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "相場まとめレポート一覧",
        "url": `${BASE_URL}/daily-reports`,
        "publisher": { "@type": "Organization", "name": "億り人・決算速報 (RIN)" }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', borderBottom: '3px solid #60a5fa', paddingBottom: '0.5rem' }}>
                📝 毎日のAI相場まとめレポート
            </h1>

            <div style={{ background: 'rgba(96, 165, 250, 0.1)', border: '1px solid #60a5fa', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                <p>
                    AIが毎日の適時開示情報（TDnet）から重要な「業績修正」や「配当発表」を抽出し、
                    証券アナリスト視点で本日の日本株市場を総括するレポートを提供しています。明日の投資戦略にお役立てください。
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {reports.map((report: any) => (
                    <Link key={report.id} href={`/daily-reports/${report.date_str}`} style={{ textDecoration: 'none' }}>
                        <div style={{ 
                            background: '#1e293b', 
                            borderRadius: '12px', 
                            border: '1px solid #334155', 
                            padding: '1.5rem',
                            transition: 'transform 0.2s, background 0.2s'
                        }} className="hover:bg-slate-800">
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                📅 {report.date_str}
                            </div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#f8fafc', marginBottom: '0.5rem' }}>
                                {report.title}
                            </h2>
                            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {/* Extracting basic text snippet from markdown. Simple replacement of md tokens. */}
                                {report.content_md ? report.content_md.substring(0, 150).replace(/[#*`_\]\[>]/g, '') : "記事内容を見る"}...
                            </p>
                            <div style={{ color: '#60a5fa', fontSize: '0.9rem', marginTop: '1rem', fontWeight: 'bold' }}>
                                続きを読む &rarr;
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {reports.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#1e293b', borderRadius: '8px' }}>
                    レポートはまだありません。毎日の夕方に自動生成されます。
                </div>
            )}
        </div>
    );
}
