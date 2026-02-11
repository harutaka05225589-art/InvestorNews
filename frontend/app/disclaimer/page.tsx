import React from 'react';

export const metadata = {
    title: '免責事項・運営者情報 | 億り人・決算速報',
    description: '当サイトの免責事項、プライバシーポリシー、および運営者情報について。',
};

export default function DisclaimerPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1.5rem', color: '#e2e8f0', lineHeight: '1.8' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                免責事項・運営者情報
            </h1>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#f87171', marginBottom: '1rem' }}>免責事項</h2>
                <p>
                    当サイト「億り人・決算速報」（以下、当サイト）に掲載されている情報は、投資判断の参考となる情報の提供を目的としており、
                    特定の銘柄の売買を推奨するものではありません。
                </p>
                <p style={{ marginTop: '1rem' }}>
                    当サイトの情報は、TDnetやEDINET等の公開情報に基づき、AIおよび自動化プログラムを用いて作成されていますが、
                    その正確性、完全性、即時性を保証するものではありません。
                    当サイトの情報を用いて行われた投資行動の結果について、運営者および関係者は一切の責任を負いません。
                    投資は必ずご自身の判断と責任において行ってください。
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#4ade80', marginBottom: '1rem' }}>運営者情報</h2>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/profile_logo.jpg" alt="Rich Investor News Logo" style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #3b82f6', objectFit: 'cover' }} />
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                            <th style={{ textAlign: 'left', padding: '1rem', width: '30%' }}>サイト名</th>
                            <td style={{ padding: '1rem' }}>億り人・決算速報</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>運営者</th>
                            <td style={{ padding: '1rem' }}>Investor News Operations</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>公式SNS</th>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <a href="https://x.com/stock_calendar" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>𝕏 (旧Twitter):</span> @stock_calendar
                                    </a>
                                    <span style={{ color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ color: '#00b900', fontWeight: 'bold' }}>LINE:</span> 公式アカウント準備中
                                    </span>
                                </div>
                            </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>お問い合わせ</th>
                            <td style={{ padding: '1rem' }}>
                                <a href="/inquiry" style={{ color: '#3b82f6', textDecoration: 'underline' }}>お問い合わせフォーム</a>よりご連絡ください。
                            </td>
                        </tr>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>URL</th>
                            <td style={{ padding: '1rem' }}>https://rich-investor-news.com</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section>
                <h2 style={{ fontSize: '1.4rem', color: '#4ade80', marginBottom: '1rem' }}>広告について</h2>
                <p>
                    当サイトでは、第三者配信の広告サービス（Google AdSense）を利用しています。
                    このような広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、
                    当サイトや他サイトへのアクセスに関する情報「Cookie」を使用することがあります。
                </p>
            </section>
        </div>
    );
}
