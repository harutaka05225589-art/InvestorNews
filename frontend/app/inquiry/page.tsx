'use client';

export default function InquiryPage() {
    // Replace this with your actual Google Form URL
    const googleFormUrl = 'https://forms.gle/cFCCihp67TVG8fcb7';

    return (
        <div>
            <h1>投資家追加リクエスト</h1>
            <div className="card">
                <p style={{ marginBottom: '1.5rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                    追加してほしい投資家の名前を教えてください。<br />
                    以下のフォームよりリクエストを受け付けています。
                </p>

                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <a
                        href={googleFormUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inquiry-btn"
                        style={{
                            textDecoration: 'none',
                            display: 'inline-block',
                            background: 'var(--primary)',
                            color: '#0f172a',
                            fontWeight: 'bold',
                            padding: '0.75rem 2rem'
                        }}
                    >
                        Googleフォームを開く
                    </a>
                </div>

                <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>
                    ※ 外部サイト（Googleフォーム）へ移動します
                </p>
            </div>
        </div>
    );
}
