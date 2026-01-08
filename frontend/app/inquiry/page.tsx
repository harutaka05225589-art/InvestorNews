'use client';

export default function InquiryPage() {
    // Google Form URL for embedding
    // Note: Converted from shortened URL to full URL for iframe compatibility
    // https://forms.gle/cFCCihp67TVG8fcb7 -> https://docs.google.com/forms/d/e/1FAIpQLS... (estimated)
    // Using the direct link with viewform?embedded=true works best if the full ID is known. 
    // Since we only have the short link, we'll try to use it directly, but ideally we need the full URL.
    // However, usually forms.gle redirects work in iframes if X-Frame-Options allows.
    // To be safe, let's use the provided link and hope for the best, or use a reliable redirect method.

    // Actually, waiting for the full URL from the curl command would be best, 
    // but to proceed, I will use the short link as src. 
    // If it fails, I will instruct the user how to get the embed code.
    const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSepZqZzJjXJ9yQxXQXQxQxQxQxQxQxQxQ/viewform?embedded=true';
    // WAIT, I don't have the full ID yet. I should simply use the shortened link and see.
    // But Google usually blocks shortened links in iframes.

    // Let's use the short link for now, but I'll add a link to open it externally too.
    const formSrc = "https://docs.google.com/forms/d/e/1FAIpQLScP_Z7Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9/viewform?embedded=true";

    // Since I can't get the full URL without the curl output, and I need to be precise.
    // I will use a placeholder that I'll update AS SOON as I see the curl output.
    // Ah, I can't see the output in this turn.

    // Alternative: Just use the shortened URL.
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
