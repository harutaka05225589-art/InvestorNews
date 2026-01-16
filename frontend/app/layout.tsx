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

import Header from './components/Header';

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "投資家ニュース (Investor News)",
              "url": "https://rich-investor-news.com",
              "logo": "https://rich-investor-news.com/icon.png",
              "description": "日本株市場で注目される著名投資家の動向やニュースを自動収集・配信するメディア。",
              "sameAs": []
            })
          }}
        />
      </head>
      <body>
        <main className="container">
          <Header />
          {children}
          <footer style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: 'var(--secondary)', fontSize: '0.9rem' }}>
            <p>&copy; {new Date().getFullYear()} Investor News. All rights reserved.</p>
          </footer>
        </main>
      </body>
    </html>
  );
}

