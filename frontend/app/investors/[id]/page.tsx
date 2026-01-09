import { getInvestorById, getNewsByInvestor } from '@/lib/db';
import { Investor, NewsItem } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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
        },
    };
}

export default async function InvestorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const investor = getInvestorById(id) as Investor | undefined;

    if (!investor) {
        notFound();
    }

    const news = getNewsByInvestor(id) as NewsItem[];
    const freeNews = news.filter(n => n.is_paid === 0);
    const paidNews = news.filter(n => n.is_paid === 1);

    return (
        <div>
            <div className="card" style={{ marginBottom: '2rem', borderColor: 'var(--primary)' }}>
                <h2>{investor.name}</h2>
                <p style={{ color: 'var(--secondary)', marginBottom: '1rem', fontWeight: 'bold' }}>{investor.style_description}</p>

                {investor.profile && (
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '1rem', lineHeight: '1.8', fontSize: '0.95rem' }}>
                        {investor.profile.split('\n').map((line, i) => (
                            <p key={i} style={{ marginBottom: line.trim() ? '0.8rem' : 0 }}>{line}</p>
                        ))}
                    </div>
                )}

                {investor.twitter_url && (
                    <a href={investor.twitter_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        Official X (Twitter) &rarr;
                    </a>
                )}
            </div>

            {/* Free News Section */}
            <section style={{ marginBottom: '3rem' }}>
                <h2 className="section-title" style={{ borderBottom: '2px solid var(--profit)', display: 'inline-block', paddingBottom: '0.2rem' }}>
                    無料ニュース ({freeNews.length})
                </h2>

                {freeNews.length === 0 ? <p style={{ color: 'var(--secondary)', marginTop: '1rem' }}>記事はありません</p> : null}

                {freeNews.map(item => (
                    <div key={item.id} className="news-item">
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
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="read-more">
                            本文を読む &rarr;
                        </a>
                    </div>
                ))}
            </section>

            {/* Paid News Section */}
            <section>
                <h2 className="section-title" style={{ borderBottom: '2px solid var(--accent)', display: 'inline-block', paddingBottom: '0.2rem' }}>
                    有料記事・レポート ({paidNews.length})
                </h2>

                {paidNews.length === 0 ? <p style={{ color: 'var(--secondary)', marginTop: '1rem' }}>記事はありません</p> : null}

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
        </div>
    );
}
