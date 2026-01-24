'use client';

import Link from 'next/link';

export default function GuidePage() {
    return (
        <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>このサイトの使い方について</h1>
                <p style={{ color: '#94a3b8' }}>個人投資家のための情報収集プラットフォーム「億り人・決算速報」の機能と活用方法</p>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>

                {/* 1. Revisions */}
                <section style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem', display: 'inline-block' }}>
                        1. 業績修正 リアルタイム速報
                    </h2>
                    <p style={{ color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.8' }}>
                        TDnet（適時開示情報）とダイレクトに連携し、企業の「業績予想の修正」を即座に検知・配信します。
                        証券会社のツールよりも早く、開示された瞬間にデータを取得できるのが特徴です。
                    </p>
                    <ul style={{ paddingLeft: '1.5rem', color: '#cbd5e1', lineHeight: '1.8' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>リアルタイム検知</strong>: 発表と同時にサイトに反映されます。</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>自動判定</strong>: 上方修正（赤・緑）や下方修正（青・赤）を自動でタグ付けして表示します。</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>ランキング</strong>: 修正幅の大きさで並び替えができ、インパクトの大きい銘柄をすぐに見つけられます。</li>
                    </ul>
                </section>

                {/* 2. Investor Tracking */}
                <section style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem', display: 'inline-block' }}>
                        2. 有名投資家トラッキング
                    </h2>
                    <p style={{ color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.8' }}>
                        「誰が」「何を」注目しているかを可視化し、投資アイデアの源泉を提供します。
                    </p>
                    <ul style={{ paddingLeft: '1.5rem', color: '#cbd5e1', lineHeight: '1.8' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>AIニュース要約</strong>: 著名投資家に関連するニュースやブログを収集し、AIが3行で要約して表示します。</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>保有銘柄追跡</strong>: 大量保有報告書（EDINET）を解析し、現在どの銘柄を保有しているかポートフォリオ形式で見ることができます。</li>
                    </ul>
                </section>

                {/* 3. Calendar */}
                <section style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff', borderBottom: '2px solid #f59e0b', paddingBottom: '0.5rem', display: 'inline-block' }}>
                        3. 自分だけのIRカレンダー
                    </h2>
                    <p style={{ color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.8' }}>
                        ウォッチリストに登録した銘柄の決算発表スケジュールだけを表示する「Myカレンダー」機能です。
                        数千銘柄の中から自分の持ち株を探す必要がなくなり、重要な発表日を見逃しません。
                    </p>
                </section>

                {/* 4. LINE Notifications */}
                <section style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff', borderBottom: '2px solid #06c755', paddingBottom: '0.5rem', display: 'inline-block' }}>
                        4. LINE即時通知
                    </h2>
                    <p style={{ color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.8' }}>
                        登録銘柄にアクションがあった時だけLINE通知を受け取れます。
                        「上方修正が出た瞬間」など、本当に必要な情報だけがスマホに届きます。
                    </p>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <Link href="/settings" style={{ display: 'inline-block', padding: '0.8rem 1.5rem', background: '#06c755', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
                            LINE連携を設定する
                        </Link>
                    </div>
                </section>

                {/* 5. Plans */}
                <section style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff', borderBottom: '2px solid #a855f7', paddingBottom: '0.5rem', display: 'inline-block' }}>
                        現在の提供プラン
                    </h2>
                    <p style={{ color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.8' }}>
                        現在はベータテスト期間中のため、本来有料の「Proプラン」相当の機能を<strong>無料で一般開放</strong>しています。
                        この機会にぜひ全機能をご活用ください。
                    </p>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <Link href="/plans" style={{ display: 'inline-block', padding: '0.8rem 1.5rem', background: '#3b82f6', color: 'white', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
                            プラン詳細を見る
                        </Link>
                    </div>
                </section>

            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <Link href="/" style={{ color: '#94a3b8', textDecoration: 'underline' }}>
                    ホームに戻る
                </Link>
            </div>
        </div>
    );
}
