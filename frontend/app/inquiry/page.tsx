'use client';

export default function InquiryPage() {
    // Current Form URL
    const targetUrl = 'https://forms.gle/7UHmp7vxXqKKh7VV8';

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <h1 style={{ marginBottom: '2rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', display: 'inline-block' }}>お問い合わせ</h1>

            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ marginBottom: '1.5rem', lineHeight: '1.8' }}>
                    当サイト「億り人・決算速報」をご利用いただきありがとうございます。<br />
                    機能へのご要望、不具合の報告、その他のお問い合わせは以下のフォームより受け付けております。<br />
                    <span style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>（※ 返信にはお時間をいただく場合がございます）</span>
                </p>

                <div style={{ margin: '2rem 0' }}>
                    <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block',
                            background: 'var(--primary)',
                            color: '#000',
                            padding: '1rem 3rem',
                            borderRadius: '30px',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            fontSize: '1.1rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                            transition: 'transform 0.2s'
                        }}
                    >
                        お問い合わせフォームを開く
                    </a>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>
                    または、公式X (旧Twitter) のDMでも受け付けております。
                </p>
            </div>
        </div>
    );
}
