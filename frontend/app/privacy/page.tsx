import React from 'react';

export default function PrivacyPolicy() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', color: '#e2e8f0', lineHeight: '1.8' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>プライバシーポリシー</h1>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>1. 個人情報の非取得について</h2>
                <p>
                    当サイト「億り人・決算速報（Investor News）」（以下、本サービス）は、アカウント登録機能を設けておらず、氏名・メールアドレス・電話番号・SNSアカウント識別子・保有資産情報などの個人情報を取得・保存いたしません。
                </p>
                <p style={{ marginTop: '0.5rem' }}>
                    銘柄ページの「強気・弱気」アンケート機能では、同一ブラウザからの重複投票を防ぐ目的でのみランダムな匿名識別子（Cookie）を使用しており、個人を特定する情報は一切含まれません。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>2. AIによる分析</h2>
                <p>
                    本サービスでは、適時開示情報（TDnet）および大量保有報告書（EDINET）などの公開企業情報の分析にGoogle Gemini等のAI技術を使用しています。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>3. 広告配信について</h2>
                <p>
                    本サービスは、第三者配信の広告サービス（Google AdSense等）を利用しています。
                    広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookieを使用することがあります。
                    Cookieを無効にする方法や、Google AdSenseに関する詳細は、
                    <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Googleのポリシーと規約</a>
                    をご確認ください。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>4. 外部サービスとアクセス解析</h2>
                <p>
                    本サービスは、サイトの利用状況を把握するためにアクセス解析ツール（Google Analytics等）を利用する場合があります。
                    これらはCookieを使用しており、個人を特定しない形でデータを収集します。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>5. 免責事項</h2>
                <p>
                    本サービスが提供する投資情報（AIによる要約・分析を含む）は、情報の正確性を保証するものではありません。
                    投資に関する最終的な決定は、ユーザーご自身の判断でなさるようお願いいたします。
                    本サービスの利用により生じた損害について、運営者は一切の責任を負いません。
                </p>
            </section>

            <div style={{ marginTop: '4rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                <p>制定日: 2025年1月1日</p>
                <p>改定日: 2026年10月27日</p>
            </div>
        </main>
    );
}
