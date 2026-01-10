import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    template: '%s | 投資家ニュース',
    default: '投資家ニュース - 日本株投資家の注目情報を自動集約',
  },
  description: 'テスタ、藤本茂など、日本株市場で注目される投資家のニュースを自動で収集・要約。忙しい投資家のための時短情報サイトです。',
  keywords: ['投資家', '株', '日本株', 'ニュース', 'まとめ', 'テスタ'],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: '投資家ニュース',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'OKOMP12oUHAz49fzUJpuKZsk20XLEsF2nDPgpZRgAZk',
  },
  other: {
    'google-adsense-account': 'ca-pub-1018275382396518',
  },
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1018275382396518"
          crossOrigin="anonymous"
        ></script>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-J8SLEGQ44M"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-J8SLEGQ44M');
          `
        }} />
      </head>
      <body>
        <main className="container">
          <header>
            <div className="header-content">
              <Link href="/" className="brand">Investor News</Link>
            </div>
          </header>
          {children}
          <footer style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: 'var(--secondary)', fontSize: '0.9rem' }}>
            <nav style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
              <Link href="/privacy" style={{ color: 'var(--accent)' }}>プライバシーポリシー</Link>
              <Link href="/inquiry" style={{ color: 'var(--accent)' }}>お問い合わせ</Link>
            </nav>
            <p>&copy; {new Date().getFullYear()} Investor News. All rights reserved.</p>
          </footer>
        </main>
      </body>
    </html>
  );
}
