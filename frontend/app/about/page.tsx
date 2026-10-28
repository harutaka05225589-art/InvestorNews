import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: '当サイトについて | 億り人・決算速報',
    description: '億り人・決算速報のミッション、データソース、および運営方針について。',
};

export default function AboutPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1.5rem', color: '#e2e8f0', lineHeight: '1.8' }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        {
                            "@context": "https://schema.org",
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                {
                                    "@type": "ListItem",
                                    "position": 1,
                                    "name": "トップページ",
                                    "item": "https://rich-investor-news.com/"
                                },
                                {
                                    "@type": "ListItem",
                                    "position": 2,
                                    "name": "当サイトについて",
                                    "item": "https://rich-investor-news.com/about"
                                }
                            ]
                        },
                        {
                            "@context": "https://schema.org",
                            "@type": "AboutPage",
                            "name": "当サイトについて | 億り人・決算速報",
                            "description": "億り人・決算速報のミッション、データソース、および運営方針について。",
                            "url": "https://rich-investor-news.com/about",
                            "mainEntity": {
                                "@type": "Organization",
                                "name": "億り人・決算速報 (RIN)",
                                "description": "AIによる決算・業績修正の即時分析を提供する個人投資家向けメディア",
                                "url": "https://rich-investor-news.com/",
                                "logo": "https://rich-investor-news.com/icon.jpg"
                            }
                        }
                    ])
                }}
            />

            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                当サイトについて
            </h1>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#4ade80', marginBottom: '1rem' }}>当サイトの目的</h2>
                <p>
                    「億り人・決算速報」は、個人投資家が機関投資家に負けないための情報武装ツールです。<br />
                    膨大な適時開示情報（TDnet）や大量保有報告書（EDINET）の中から、株価に影響を与える重要なニュースだけを厳選し、AIによる即時分析を加えてお届けします。
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#38bdf8', marginBottom: '1rem' }}>3つの特徴</h2>

                <div style={{ marginBottom: '1.5rem', background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#4ade80', marginBottom: '0.5rem' }}>1. AI決算分析</h3>
                    <p style={{ fontSize: '0.95rem' }}>
                        決算短信PDFをAIが読み込み、「なぜ上方修正したのか？」「増配の余力はあるか？」を瞬時に要約。<br />
                        ポジティブ・ネガティブの判定も自動で行い、忙しい投資家の皆様の判断をサポートします。
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem', background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '0.5rem' }}>2. 著名投資家・大株主の保有変動追跡</h3>
                    <p style={{ fontSize: '0.95rem' }}>
                        金融庁のEDINETで公開される大量保有報告書（5%ルール報告）や企業の有価証券報告書から、著名個人投資家やファンドの保有状況を自動で集計し、わかりやすく可視化します。
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem', background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#06c755', marginBottom: '0.5rem' }}>3. アカウント登録不要・完全無料</h3>
                    <p style={{ fontSize: '0.95rem' }}>
                        メールアドレスやSNS連携などの個人情報登録は一切不要です。<br />
                        すべての業績修正レポート・IRカレンダー・ランキングをそのまま無料でご覧いただけます。
                    </p>
                </div>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#f59e0b', marginBottom: '1rem' }}>データソース</h2>
                <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#cbd5e1' }}>
                    <li style={{ marginBottom: '0.5rem' }}>適時開示情報閲覧サービス (TDnet)</li>
                    <li style={{ marginBottom: '0.5rem' }}>EDINET (金融庁)</li>
                    <li style={{ marginBottom: '0.5rem' }}>株探 (Kabutan) - ※一部データ参照</li>
                </ul>
            </section>

            <div style={{ marginBottom: '3rem' }}>
                <Link href="/guide" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                    &rarr; データの見方・使い方はこちら
                </Link>
            </div>
        </div>
    );
}
