'use client';

import { useState } from 'react';

export default function InquiryPage() {
    const [name, setName] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would call a server action or API to email the admin
        // For MVP, we just show success
        setTimeout(() => {
            setSubmitted(true);
            setName('');
        }, 500);
    };

    return (
        <div>
            <h1>投資家追加リクエスト</h1>
            <div className="card">
                <p style={{ marginBottom: '1rem', color: '#cbd5e1' }}>
                    追加してほしい投資家の名前を教えてください。<br />
                    管理者が確認の上、順次追加を検討します。
                </p>

                {submitted ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--profit)' }}>
                        <h3>送信しました！</h3>
                        <p>ご意見ありがとうございます。</p>
                        <button
                            onClick={() => setSubmitted(false)}
                            style={{ marginTop: '1rem', background: 'transparent', border: '1px solid var(--secondary)', color: 'var(--secondary)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            他の方もリクエストする
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                投資家のお名前
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="例: 五味大輔"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--background)',
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            className="inquiry-btn"
                            style={{ background: 'var(--primary)', color: '#0f172a', fontWeight: 'bold', border: 'none' }}
                        >
                            リクエストを送る
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
