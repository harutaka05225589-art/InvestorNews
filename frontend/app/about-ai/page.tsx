import React from 'react';
import Link from 'next/link';
import styles from './introduction.module.css'; // Reusing or creating styles

export const metadata = {
    title: 'AI決算分析の仕組みとデータの信頼性 - Investor News',
    description: 'Investor Newsが提供するAI決算要約・業績修正判定のプロセス、使用している技術、データの収集元について詳しく解説します。',
};

export default function AboutAIPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', color: '#f1f5f9' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '1.5rem', borderBottom: '2px solid var(--accent)', paddingBottom: '0.5rem' }}>
                AI決算分析の仕組みと信頼性
            </h1>
            
            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>1. データの収集源</h2>
                <p style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
                    当サイトでは、東京証券取引所が運営する適時開示情報閲覧サービス（TDnet）およびEDINETから直接データを取得しています。
                    公式な開示文書をソースとすることで、情報の一次性を確保しています。
                </p>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>2. AIによる解析プロセス</h2>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <p style={{ lineHeight: '1.8', color: '#cbd5e1', marginBottom: '1rem' }}>
                        取得したPDF文書は、以下のステップで解析されます：
                    </p>
                    <ol style={{ paddingLeft: '20px', lineHeight: '2' }}>
                        <li><strong>テキスト抽出:</strong> PDFから財務数値や文章データを高精度に抽出。</li>
                        <li><strong>数値判定:</strong> 従来の予想値と修正値を比較し、修正率を算出。</li>
                        <li><strong>要因分析:</strong> Gemini 1.5 Pro等の最新LLMを用い、「なぜ修正されたのか（為替、原材料高、需要増など）」を文脈から読み取ります。</li>
                        <li><strong>信頼性チェック:</strong> 抽出された数値が本文中の記述と不整合を起こしていないかを確認します。</li>
                    </ol>
                </div>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>3. E-E-A-Tへの取り組み</h2>
                <p style={{ lineHeight: '1.8', color: '#cbd5e1' }}>
                    私たちは、金融情報の提供において透明性が最も重要であると考えています。
                    AIが作成した要約には必ず「AIによる要約」であることを明記し、クリック一つで原文のPDFを確認できる導線を確保しています。
                    また、更新日時を明確に表示し、情報の鮮度を保証します。
                </p>
            </section>

            <section style={{ marginBottom: '2.5rem', padding: '1.5rem', border: '1px solid #ef4444', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#ef4444', marginBottom: '0.5rem' }}>免責事項</h2>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                    当サイトの情報は投資勧誘を目的としたものではありません。AIによる解析結果には万全を期していますが、その正確性を保証するものではありません。
                    株価の変動には様々な要因が影響します。投資の際は必ずご自身で開示資料の詳細を確認し、最終的な判断を行ってください。
                </p>
            </section>

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <Link href="/" style={{ padding: '0.8rem 2rem', background: 'var(--accent)', color: '#000', borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none' }}>
                    トップページへ戻る
                </Link>
            </div>
        </main>
    );
}
