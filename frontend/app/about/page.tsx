import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: '当サイトについて | 億り人・決算速報',
    description: '億り人・決算速報のミッション、データソース、および運営方針について。',
};

export default function AboutPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1.5rem', color: '#e2e8f0', lineHeight: '1.8' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                当サイトについて
            </h1>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#4ade80', marginBottom: '1rem' }}>私たちのミッション</h2>
                <p>
                    「億り人・決算速報」は、個人投資家が株式市場で勝つために必要な「一次情報」と「トップ投資家の思考」を、
                    テクノロジーの力で効率的に届けることを目的としています。
                </p>
                <p style={{ marginTop: '1rem' }}>
                    機関投資家や専業トレーダーは、有料の端末や専門チームを使って膨大な情報を処理しています。
                    しかし、個人の兼業投資家には時間もリソースも限られています。
                    私たちは、AIによる自動解析とデータ収集技術を駆使し、
                    「今、市場で何が起きているか」「勝っている投資家は何を見ているか」を瞬時に可視化します。
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#4ade80', marginBottom: '1rem' }}>主な機能とデータソース</h2>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '0.5rem' }}>1. 業績修正・決算速報</h3>
                <p>
                    企業の適時開示情報（TDnet）をリアルタイムで監視し、AIが内容を解析しています。
                    単にPDFへのリンクを貼るだけでなく、「上方修正」「下方修正」「増配」「自社株買い」などの重要なイベントを自動タグ付けし、理由を要約します。
                </p>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '0.5rem' }}>2. 著名投資家の動向</h3>
                <p>
                    大量保有報告書（EDINET）や信頼できるニュースソースから、市場で注目される大口個人投資家（いわゆる「億り人」）の保有銘柄や発言を収集しています。
                </p>
            </section>

            <div style={{ marginBottom: '3rem' }}>
                <Link href="/guide" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                    &rarr; データの見方・使い方はこちら
                </Link>
            </div>
        </div>
    );
}
