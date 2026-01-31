
import React from 'react';

export default function PrivacyPolicy() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', color: '#e2e8f0', lineHeight: '1.8' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>プライバシーポリシー</h1>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>1. 個人情報の取り扱い</h2>
                <p>
                    当サイト「Investor News」（以下、本サービス）では、ユーザーの利便性向上のために、ポートフォリオ情報（保有銘柄、株数、取得単価等）を入力・保存する機能を提供しています。
                    これらの情報は、ユーザー自身の資産管理および配当予測の計算のみに使用され、第三者に提供・販売されることはありません。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>2. AIによる分析</h2>
                <p>
                    本サービスでは、適時開示情報（TDnet）の分析にGoogle Gemini等のAI技術を使用しています。
                    公開されている企業情報のみを分析対象としており、ユーザーの非公開データ（ポートフォリオ詳細など）をAIの学習データとして送信することはありません。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>3. 外部サービスとアクセス解析</h2>
                <p>
                    本サービスは、サイトの利用状況を把握するためにアクセス解析ツール（Google Analytics等）を利用する場合があります。
                    これらはCookieを使用しており、個人を特定しない形でデータを収集します。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>4. 免責事項</h2>
                <p>
                    本サービスが提供する投資情報（AIによる要約・分析を含む）は、情報の正確性を保証するものではありません。
                    投資に関する最終的な決定は、ユーザーご自身の判断でなさるようお願いいたします。
                    本サービスの利用により生じた損害について、運営者は一切の責任を負いません。
                </p>
            </section>

            <div style={{ marginTop: '4rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                <p>制定日: 2025年1月1日</p>
                <p>改定日: 2026年2月1日</p>
            </div>
        </main>
    );
}
