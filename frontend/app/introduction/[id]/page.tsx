
import { getInvestorById } from '@/lib/db';
import { Investor } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SimpleMarkdown from '@/app/components/SimpleMarkdown';
import styles from '../introduction.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const investor = getInvestorById(id) as Investor | undefined;

    if (!investor) {
        return { title: '投資家が見つかりません' };
    }

    return {
        title: `${investor.name}の投資手法・経歴【詳細解説】`,
        description: `${investor.name}の基本情報、投資スタイル、資産形成の経緯などを詳しく解説します。`,
    };
}

export default async function InvestorArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const investor = getInvestorById(id) as Investor | undefined;

    if (!investor) {
        notFound();
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header / Hero Section */}
            <div className="card" style={{ marginBottom: '2rem', textAlign: 'center', borderColor: 'var(--primary)' }}>
                {investor.image_url ? (
                    <img src={investor.image_url} alt={investor.name} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem', border: '3px solid var(--primary)' }} />
                ) : (
                    <div style={{ width: '100px', height: '100px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem', border: '2px solid var(--border)' }}>
                        {investor.name[0]}
                    </div>
                )}
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{investor.name}</h1>
                <p style={{ color: 'var(--secondary)', fontSize: '1.1rem' }}>{investor.style_description}</p>
            </div>

            {/* Main Article Content */}
            <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
                {investor.profile ? (
                    <SimpleMarkdown content={investor.profile} />
                ) : (
                    <p>記事の準備中です。</p>
                )}
            </div>

            {/* Affiliate / Ad Placeholder (Hidden until AdSense approved) */}
            {/* 
            <div style={{ 
                border: '2px dashed var(--accent)', 
                borderRadius: '8px', 
                padding: '2rem', 
                textAlign: 'center', 
                background: 'rgba(251, 191, 36, 0.05)',
                marginBottom: '3rem'
            }}>
                <h3 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>おすすめ証券会社</h3>
                <p style={{ marginBottom: '1rem' }}>ここに証券会社のアフィリエイトリンクを配置予定です。</p>
                <div style={{ display: 'inline-block', padding: '1rem 2rem', background: '#333', borderRadius: '4px' }}>
                    [あて先リンク: SBI証券 / 楽天証券など]
                </div>
            </div>
            */}

            {/* Footer Navigation */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <Link href="/introduction" className={styles.backLink} style={{ display: 'inline-block', padding: '0.8rem 1.5rem', background: 'var(--card-bg)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    &larr; 投資家一覧に戻る
                </Link>
                <Link href={`/investors/${id}`} style={{ display: 'inline-block', padding: '0.8rem 1.5rem', background: 'var(--primary)', color: '#000', fontWeight: 'bold', borderRadius: '4px' }}>
                    最新ニュースを見る &rarr;
                </Link>
            </div>
        </div>
    );
}
