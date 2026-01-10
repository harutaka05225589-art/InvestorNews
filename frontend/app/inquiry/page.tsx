'use client';

export default function InquiryPage() {
    // ★TODO: PLACEHOLDER for New Inquiry Form URL
    // Please replace this URL with the new Google Form URL for "Contact Us"
    const targetUrl = ''; // e.g. 'https://docs.google.com/forms/d/e/...'

    return (
        <div>
            <h1>お問い合わせ</h1>
            <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                {targetUrl ? (
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
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <p style={{ marginBottom: '1rem' }}>お問い合わせフォームは現在準備中です。</p>
                        <p>管理者の方へ：ソースコード (frontend/app/inquiry/page.tsx) の <code>targetUrl</code> を新しいGoogleフォームのURLに更新してください。</p>
                    </div>
                )}

                {targetUrl && (
                    <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                        <p>フォームが表示されない場合は <a href={targetUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>こちら</a> から直接開いてください。</p>
                    </div>
                )}
            </div>
        </div>
    );
}
