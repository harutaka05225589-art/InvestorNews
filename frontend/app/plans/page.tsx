export default function PlansPage() {
    return (
        <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>プランと機能</h1>
                <p style={{ color: '#94a3b8' }}>現在はベータテスト期間中のため、<strong>全ての有料機能を無料で開放</strong>しています。</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Free Plan */}
                <div style={{ background: '#1e293b', borderRadius: '12px', padding: '2rem', border: '1px solid #334155' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>Free プラン</h2>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                        ¥0 <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#94a3b8' }}>/ 月</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#e2e8f0' }}>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '0.5rem' }}>✅</span> 業績修正速報 (20分遅延)
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '0.5rem' }}>✅</span> ウォッチリスト登録 (10銘柄まで)
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '0.5rem' }}>✅</span> LINE通知 (1日1回のまとめ)
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '0.5rem' }}>✅</span> ニュース閲覧 (制限なし)
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', opacity: 0.6 }}>
                            <span style={{ marginRight: '0.5rem' }}>📺</span> 広告表示あり
                        </li>
                    </ul>
                </div>

                {/* Pro Plan */}
                <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '12px', padding: '2rem', border: '2px solid #6366f1', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#6366f1', padding: '0.2rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        現在 全員無料開放中！
                    </div>

                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>Pro プラン</h2>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#fbbf24' }}>
                        ¥980 <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#cbd5e1' }}>/ 月 (予定)</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#fff' }}>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '0.5rem' }}>⚡</span> <strong>業績修正 リアルタイム速報</strong>
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '0.5rem' }}>♾️</span> <strong>ウォッチリスト 無制限</strong>
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '0.5rem' }}>🔔</span> <strong>LINE 即時プッシュ通知</strong>
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '0.5rem' }}>🛡️</span> 大量保有報告アラート
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '0.5rem' }}>🚫</span> 広告非表示
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '0.5rem' }}>🤖</span> AI要約 (3行まとめ)
                        </li>
                    </ul>
                </div>
            </div>

            <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#334155', borderRadius: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#fff' }}>ベータテスト期間について</h3>
                <p>
                    現在はシステムの負荷テスト及び機能改善期間のため、アカウントを作成された全てのユーザー様に対して「Proプラン」相当の機能を無料で提供しております。<br />
                    有料化の開始時期が決まりましたら、事前にサイト上およびメール/LINEにて告知いたします。（勝手に課金が始まることはありませんのでご安心ください）
                </p>
            </div>
        </div>
    );
}
