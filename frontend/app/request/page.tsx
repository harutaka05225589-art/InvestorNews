'use client';

export default function RequestPage() {
    // Investor Request Form (Existing)
    const targetUrl = 'https://forms.gle/cFCCihp67TVG8fcb7';

    return (
        <div>
            <h1>投資家追加リクエスト</h1>
            <div className="card" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ fontSize: '3rem' }}>📝</div>
                <p>
                    追加してほしい投資家や、情報の訂正などはこちらのフォームからお知らせください。<br />
                    皆様のリクエストをもとに、より良いメディアにしていきます。
                </p>

                <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-button"
                    style={{
                        textDecoration: 'none',
                        display: 'inline-block',
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        borderRadius: '8px',
                        background: 'var(--primary)',
                        color: '#000',
                        fontWeight: 'bold',
                        marginTop: '1rem'
                    }}
                >
                    リクエストフォームを開く ↗
                </a>

                <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginTop: '1rem' }}>
                    ※ Googleフォームが新しいタブで開きます
                </p>
            </div>
        </div>
    );
}
