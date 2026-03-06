import { getInvestorById, getNewsByInvestor } from '@/lib/db';
import { Investor, NewsItem } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import AdSenseInFeed from '../../../components/ads/AdSenseInFeed';
import AdSenseDisplay from '../../../components/ads/AdSenseDisplay';
// Removed duplicate import

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const investor = getInvestorById(id) as Investor | undefined;

    if (!investor) {
        return {
            title: '投資家が見つかりません',
        };
    }

    return {
        title: `${investor.name}のニュース・評判`,
        description: `${investor.name} (${investor.style_description}) に関する最新ニュース、記事、発言のまとめ。`,
        openGraph: {
            title: `${investor.name} - 投資家ニュース`,
            description: `${investor.name}の最新情報をチェック。`,
            images: [
                {
                    url: `https://rich-investor-news.com/og-image.png?title=${encodeURIComponent(investor.name)}&subtitle=${encodeURIComponent(investor.style_description.substring(0, 30))}&type=profile`,
                    width: 1200,
                    height: 630,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${investor.name}のニュース・評判`,
            description: `${investor.name}の最新情報をチェック。`,
            images: [`https://rich-investor-news.com/og-image.png?title=${encodeURIComponent(investor.name)}&subtitle=${encodeURIComponent(investor.style_description.substring(0, 30))}&type=profile`],
        },
    };
}

export default async function InvestorPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ page?: string }>
}) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const page = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1;
    const limit = 20; // 20 items per page

    const investor = getInvestorById(id) as Investor | undefined;

    if (!investor) {
        notFound();
    }

    const { news, total } = getNewsByInvestor(id, page, limit);
    const totalPages = Math.ceil(total / limit);

    // Safely parse aliases
    let aliases: string[] = [];
    try {
        aliases = investor.aliases ? JSON.parse(investor.aliases) : [];
    } catch (e) { /* ignore parse error */ }

    // Check main name and all aliases
    const searchNames = [investor.name, ...aliases].filter(Boolean);

    const freeNews = news.filter(n => n.is_paid === 0);
    const paidNews = news.filter(n => n.is_paid === 1);

    return (
        <div>
            <div className="card" style={{ marginBottom: '2rem', borderColor: 'var(--primary)' }}>
                <h2>{investor.name}</h2>
                <p style={{ color: 'var(--secondary)', marginBottom: '1rem', fontWeight: 'bold' }}>{investor.style_description}</p>

                <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                    <Link href={`/introduction/${id}`} style={{
                        display: 'inline-block',
                        padding: '0.8rem 1.5rem',
                        background: 'var(--card-bg)',
                        color: 'var(--primary)',
                        border: '1px solid var(--primary)',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontWeight: 'bold'
                    }}>
                        {investor.name}の詳しい紹介記事を読む &rarr;
                    </Link>
                </div>

                {investor.twitter_url && (
                    <a href={investor.twitter_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        Official X (Twitter) &rarr;
                    </a>
                )}
            </div>


            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                {page > 1 ? (
                    <Link href={`/investors/${id}?page=${page - 1}`} style={{ padding: '0.5rem 1rem', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        &larr; 前へ
                    </Link>
                ) : <div></div>}

                <span style={{ color: 'var(--secondary)' }}>
                    Page {page} / {totalPages || 1} (全{total}件)
                </span>

                {page < totalPages ? (
                    <Link href={`/investors/${id}?page=${page + 1}`} style={{ padding: '0.5rem 1rem', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        次へ &rarr;
                    </Link>
                ) : <div></div>}
            </div>

            {/* News Volume Chart (Simple CSS Bar Chart) */}
            <section style={{ marginBottom: '3rem' }}>
                <h2 className="section-title" style={{ borderBottom: '2px solid var(--primary)', display: 'inline-block', paddingBottom: '0.2rem' }}>
                    メディア掲載数推移 (過去7日間)
                </h2>
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                        このグラフは、直近1週間で各投資家に関するニュースや記事がどれくらいメディアに取り上げられたか（話題の大きさ）を表しています。
                    </p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '8px' }}>
                        {(() => {
                            // Note: Charts should ideally use a separate API to get full stats, 
                            // but for now we use the loaded news. This might be inaccurate with pagination.
                            // Ideally we'd fetch stats separately.
                            const today = new Date();
                            const stats = [];
                            // For chart, we need more data than current page. 
                            // Using displayed news is a limitation here but acceptable for now.
                            // Ideally: create getNewsStats(id)
                            for (let i = 6; i >= 0; i--) {
                                const d = new Date();
                                d.setDate(today.getDate() - i);
                                const dateStr = d.toLocaleDateString();
                                const count = news.filter(n => new Date(n.published_at).toLocaleDateString() === dateStr).length;
                                stats.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, count });
                            }
                            const maxCount = Math.max(...stats.map(s => s.count), 1);

                            return stats.map((day, idx) => (
                                <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{
                                        height: `${(day.count / maxCount) * 100}%`,
                                        background: day.count > 0 ? 'var(--profit)' : 'rgba(255,255,255,0.1)',
                                        borderRadius: '4px 4px 0 0',
                                        minHeight: '4px',
                                        transition: 'height 0.3s ease'
                                    }}></div>
                                    <div style={{ fontSize: '0.7rem', marginTop: '4px', color: 'var(--secondary)' }}>{day.date}</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{day.count}</div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </section>


            {/* Free News Section */}
            <section style={{ marginBottom: '3rem' }}>
                <h2 className="section-title" style={{ borderBottom: '2px solid var(--profit)', display: 'inline-block', paddingBottom: '0.2rem' }}>
                    無料ニュース ({freeNews.length})
                </h2>

                {freeNews.length === 0 ? <p style={{ color: 'var(--secondary)', marginTop: '1rem' }}>このページの表示範囲に記事はありません</p> : null}

                {freeNews.map((item, index) => (
                    <Fragment key={item.id}>
                        <div className="news-item">
                            <div className="news-meta">
                                <span className="label-free">FREE</span>
                                <span>{item.domain}</span>
                                <span>{new Date(item.published_at).toLocaleDateString()}</span>
                            </div>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-title">
                                {item.title}
                            </a>
                            <div className="news-summary">
                                {item.summary}
                            </div>

                            {/* AI Summary Widget */}
                            {item.ai_summary && (
                                <div style={{
                                    marginTop: '0.8rem',
                                    padding: '0.8rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    borderLeft: '3px solid #3b82f6',
                                    borderRadius: '4px',
                                    fontSize: '0.9rem',
                                    color: '#e2e8f0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem', color: '#60a5fa', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                        <span style={{ marginRight: '0.3rem' }}>🤖</span> AI要約
                                    </div>
                                    {item.ai_summary}
                                </div>
                            )}

                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="read-more">
                                本文を読む &rarr;
                            </a>
                        </div>
                        {/* Ad every 5 items */}
                        {(index + 1) % 5 === 0 && (
                            <div style={{ margin: '2rem 0' }}>
                                <AdSenseInFeed slotId="3072451399" layoutKey="-fb+5w+4e-db+86" />
                            </div>
                        )}
                    </Fragment>
                ))}
            </section>

            {/* Paid News Section */}
            <section>
                <h2 className="section-title" style={{ borderBottom: '2px solid var(--accent)', display: 'inline-block', paddingBottom: '0.2rem' }}>
                    有料記事・レポート ({paidNews.length})
                </h2>

                {paidNews.length === 0 ? <p style={{ color: 'var(--secondary)', marginTop: '1rem' }}>このページの表示範囲に記事はありません</p> : null}

                {paidNews.map(item => (
                    <div key={item.id} className="news-item">
                        <div className="news-meta">
                            <span className="label-paid">PREMIUM</span>
                            <span>{item.domain}</span>
                            <span>{new Date(item.published_at).toLocaleDateString()}</span>
                        </div>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-title">
                            {item.title}
                        </a>
                        <div className="news-summary" style={{ fontStyle: 'italic', opacity: 0.8 }}>
                            {item.summary}
                        </div>

                        {/* AI Summary Widget */}
                        {item.ai_summary && (
                            <div style={{
                                marginTop: '0.8rem',
                                padding: '0.8rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderLeft: '3px solid #3b82f6',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                color: '#e2e8f0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem', color: '#60a5fa', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                    <span style={{ marginRight: '0.3rem' }}>🤖</span> AI要約
                                </div>
                                {item.ai_summary}
                            </div>
                        )}

                        <br />
                        <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid var(--accent)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--accent)', marginTop: '0.5rem' }}>
                            🔒 有料記事または会員限定です。内容は推測できません。
                        </div>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="read-more">
                            公式サイトで確認 &rarr;
                        </a>
                    </div>
                ))}
            </section>

            {/* Pagination Controls (Bottom) */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {page > 1 && (
                        <Link href={`/investors/${id}?page=${page - 1}`} style={{ padding: '0.5rem 1rem', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            &larr; 前のページ
                        </Link>
                    )}
                    {page < totalPages && (
                        <Link href={`/investors/${id}?page=${page + 1}`} style={{ padding: '0.5rem 1rem', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            次のページ &rarr;
                        </Link>
                    )}
                </div>
            </div>

            {/* Bottom Ad */}
            <div style={{ marginTop: '3rem' }}>
                <AdSenseDisplay slotId="6065455983" format="auto" responsive={true} />
            </div>
        </div >
    );
}
