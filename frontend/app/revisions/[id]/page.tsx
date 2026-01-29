import { notFound } from 'next/navigation';
import Database from 'better-sqlite3';
import path from 'path';
import type { Metadata } from 'next';
import Link from 'next/link';

// Function to get DB connection (reused logic)
const DB_PATH = path.join(process.cwd(), 'investor_news.db');

function getRevision(id: string) {
    try {
        const db = new Database(DB_PATH, { readonly: true });
        const stmt = db.prepare('SELECT * FROM revisions WHERE id = ?');
        return stmt.get(id) as any;
    } catch (e) {
        console.error("DB Error:", e);
        return null;
    }
}

type Props = {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const revision = getRevision(id);

    if (!revision) {
        return {
            title: 'Not Found',
            description: 'The requested revision could not be found.'
        };
    }

    const title = `${revision.company_name} (${revision.ticker}) 上方修正`;
    const subtitle = revision.ai_summary || '業績予想の修正を発表';

    // Construct OGP Image URL
    // Use proper encoding for Japanese characters
    const ogTitle = encodeURIComponent(title);
    const ogSubtitle = encodeURIComponent(subtitle);

    // Using absolute URL for production
    const ogImageUrl = `https://rich-investor-news.com/api/og?title=${ogTitle}&subtitle=${ogSubtitle}&type=alert`;

    return {
        title: `${title} | 億り人・決算速報`,
        description: subtitle,
        openGraph: {
            title: title,
            description: subtitle,
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: subtitle,
            images: [ogImageUrl],
        },
    };
}

export default async function RevisionPage({ params }: Props) {
    const { id } = await params;
    const revision = getRevision(id);

    if (!revision) {
        return notFound();
    }

    const isUpward = revision.is_upward === 1;
    const bgColor = isUpward ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    const borderColor = isUpward ? '#22c55e' : '#ef4444';
    const textColor = isUpward ? '#4ade80' : '#f87171';

    return (
        <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1.5rem', color: '#fff' }}>
            <Link href="/revisions" style={{ color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
                &larr; 一覧に戻る
            </Link>

            <article style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ background: '#0f172a', padding: '2rem', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <span style={{
                            background: '#334155', color: '#fff', padding: '0.2rem 0.6rem',
                            borderRadius: '4px', fontSize: '0.9rem', fontFamily: 'monospace'
                        }}>
                            {revision.ticker}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                            {new Date(revision.revision_date).toLocaleDateString()}
                        </span>
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem', lineHeight: 1.4 }}>
                        {revision.company_name}
                    </h1>

                    <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '30px', background: bgColor, border: `1px solid ${borderColor}`, color: textColor, fontWeight: 'bold' }}>
                        {isUpward ? '📈 上方修正' : '📉 下方修正'}
                        {isUpward && revision.revision_rate_op > 0 && ` (+${revision.revision_rate_op}%)`}
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#e2e8f0' }}>AI要約</h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#cbd5e1', marginBottom: '2rem' }}>
                        {revision.ai_summary}
                    </p>

                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#94a3b8' }}>詳細情報</h2>
                    <div style={{ display: 'grid', gap: '1rem', color: '#cbd5e1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                            <span>種別</span>
                            <span>{revision.quarter || '通期予想'}</span>
                        </div>
                        {/* Add more details if available in DB */}
                    </div>

                    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                        <a
                            href={revision.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-block',
                                background: '#3b82f6',
                                color: 'white',
                                textDecoration: 'none',
                                padding: '1rem 2rem',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                transition: 'transform 0.2s'
                            }}
                        >
                            📄 PDF資料を見る (TDnet)
                        </a>
                    </div>
                </div>
            </article>

            <div style={{ marginTop: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                <p>※ AIによる自動解析結果であり、内容の正確性を保証するものではありません。必ず一次情報をご確認ください。</p>
            </div>
        </div>
    );
}
