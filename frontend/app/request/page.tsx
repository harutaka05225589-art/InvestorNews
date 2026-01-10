'use client';

export default function RequestPage() {
    // Investor Request Form (Existing)
    const targetUrl = 'https://forms.gle/cFCCihp67TVG8fcb7';

    return (
        <div>
            <h1>投資家追加リクエスト</h1>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <iframe
                    src={targetUrl}
                    width="100%"
                    height="800"
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    style={{ background: 'var(--background)' }}
                >
                    読み込んでいます…
                </iframe>

                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    <p>フォームが表示されない場合は <a href={targetUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>こちら</a> から直接開いてください。</p>
                </div>
            </div>
        </div>
    );
}
