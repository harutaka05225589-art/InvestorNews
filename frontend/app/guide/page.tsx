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
                <h2 style={{ fontSize: '1.4rem', color: '#4ade80', marginBottom: '1rem' }}>このサイトについて</h2>
                <p>
                    「億り人・決算速報」は、上場企業の適時開示情報（TDnet）をAIが自動監視し、
                    投資家にとって重要な「業績修正」や「増配」情報をリアルタイムで配信するサービスです。
                </p>
                <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '1rem', color: '#cbd5e1' }}>
                    <li style={{ marginBottom: '0.5rem' }}>AIが「ポジティブ（上方修正・増配）」か「ネガティブ」かを即座に判定</li>
                    <li style={{ marginBottom: '0.5rem' }}>難しい決算短信を要約し、修正の「理由」をわかりやすく解説</li>
                    <li style={{ marginBottom: '0.5rem' }}>LINE連携で、保有株・ウォッチ株の重要ニュースをプッシュ通知</li>
                </ul>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#38bdf8', marginBottom: '1rem' }}>主な機能と使い方</h2>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem', borderLeft: '4px solid #38bdf8', paddingLeft: '0.5rem' }}>1. 決算速報（トップページ）</h3>
                    <p>
                        最新の業績修正情報が時系列で表示されます。<br />
                        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>青色背景</span>は上方修正や増配、
                        <span style={{ color: '#f87171', fontWeight: 'bold' }}>赤色背景</span>は下方修正や減配を表します。
                        クリックすると、詳細ページでAIによる解説や元データ（PDF）を確認できます。
                    </p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem', borderLeft: '4px solid #38bdf8', paddingLeft: '0.5rem' }}>2. ポートフォリオ管理</h3>
                    <p>
                        あなたの保有銘柄を登録すると、資産推移や配当金の受け取り予定をグラフで可視化できます。<br />
                        さらに、登録した銘柄に「上方修正」や「増配」が出た際、LINEやメールで通知を受け取ることができます。
                    </p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem', borderLeft: '4px solid #06c755', paddingLeft: '0.5rem' }}>3. LINE通知連携</h3>
                    <p>
                        設定ページからLINE公式アカウントと連携することで、自分だけの重要通知を受け取れます。
                    </p>
                    <ul style={{ background: '#1e293b', padding: '1rem', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        <li>🔔 <strong>決算アラート:</strong> 保有株の決算発表日が近づくとお知らせ</li>
                        <li>🚀 <strong>サプライズ通知:</strong> 保有株に上方修正や自社株買いが出た瞬間に速報</li>
                        <li>💰 <strong>目標株価到達:</strong> 設定した価格に到達した際にお知らせ</li>
                    </ul>
                </div>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#f59e0b', marginBottom: '1rem' }}>用語解説</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#4ade80', marginBottom: '0.3rem' }}>上方修正 (Upward Revision)</div>
                        <div style={{ fontSize: '0.9rem' }}>企業の業績が、以前の予想よりも良くなること。株価上昇のきっかけになりやすいです。</div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#4ade80', marginBottom: '0.3rem' }}>増配 (Dividend Hike)</div>
                        <div style={{ fontSize: '0.9rem' }}>株主に配る配当金を増やすこと。経営の自信の表れであり、長期保有者にとって嬉しいニュースです。</div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '0.3rem' }}>自社株買い (Buyback)</div>
                        <div style={{ fontSize: '0.9rem' }}>企業が自分の会社の株を買い戻すこと。市場に出回る株数が減るため、1株あたりの価値（EPS）が上がり、株価にプラスに働きます。</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
