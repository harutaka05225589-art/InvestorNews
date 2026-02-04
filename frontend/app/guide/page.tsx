import React from 'react';

export const metadata = {
    title: 'データの見方・使い方 | 億り人・決算速報',
    description: '業績修正情報の見方、AIによる判定基準、各用語の解説。',
};

export default function GuidePage() {
    return (
        <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1.5rem', color: '#e2e8f0', lineHeight: '1.8' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                データの見方・使い方
            </h1>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#4ade80', marginBottom: '1rem' }}>業績修正について</h2>
                <p>
                    当サイトでは、企業が発表する「業績予想の修正」をAIが自動で分類しています。
                </p>

                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#4ade80', marginBottom: '0.5rem' }}>📈 上方修正 (Upward Revision)</h3>
                    <p>
                        売上高や利益が、以前の予想よりも「良くなる」と企業が発表した場合に表示されます。
                        一般的に株価にはポジティブな影響を与えやすいですが、市場の期待値（コンセンサス）がそれ以上に高かった場合は、材料出尽くしとして売られることもあります。
                    </p>
                </div>

                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f87171', marginBottom: '0.5rem' }}>📉 下方修正 (Downward Revision)</h3>
                    <p>
                        売上高や利益が、以前の予想よりも「悪くなる」と企業が発表した場合に表示されます。
                        ネガティブな要因ですが、悪材料出尽くしとして逆に買われる（アク抜け）こともあります。
                    </p>
                </div>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#4ade80', marginBottom: '1rem' }}>AI要約の活用法</h2>
                <p>
                    各詳細ページには、AIがPDF資料を読み込んで生成した「要約」が表示されます。
                    ここには、単なる数字だけでなく、「なぜ修正されたのか」という理由（為替差益、受注増、原材料高など）が記載されています。
                </p>
                <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    ※ AIの解析結果は必ずしも100%正確ではありません。最終的な投資判断を行う際は、必ずリンク先の一次情報（PDF）をご確認ください。
                </p>
            </section>
        </div>
    );
}
