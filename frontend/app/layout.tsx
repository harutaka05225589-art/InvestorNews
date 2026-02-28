import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    template: '%s | 億り人・決算速報 (RIN)',
    default: '億り人・決算速報 (RIN) - 投資家ニュースとIRカレンダー',
  },
  description: '著名投資家の動向と企業の決算スケジュールを網羅。億り人のニュースと最新のIR情報をまとめてチェックできる投資家必須のサイト(RIN: Rich Investor News)です。',
  keywords: ['投資家', '株', '決算', 'カレンダー', 'テスタ', '億り人', 'IR', 'RIN', 'Rich Investor News'],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: '億り人・決算速報 (RIN)',
    title: '億り人・決算速報 (RIN)',
    description: '著名投資家の動向と企業の決算スケジュールを網羅(RIN)。',
    images: [
      {
        url: 'https://rich-investor-news.com/api/og',
        width: 1200,
        height: 630,
        alt: '億り人・決算速報 (RIN)',
      }
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: 'summary_large_image',
    title: '億り人・決算速報 (RIN)',
    description: '著名投資家の動向と企業の決算スケジュールを網羅。',
    images: ['https://rich-investor-news.com/api/og'],
  },
  verification: {
    google: 'OKOMP12oUHAz49fzUJpuKZsk20XLEsF2nDPgpZRgAZk',
  },
  other: {
    'google-adsense-account': 'ca-pub-1018275382396518',
  },
}; export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevents iOS Safari zoom on input focus
  userScalable: false,
};

import Script from 'next/script';

import Header from './components/Header';

import Sidebar from './components/Sidebar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
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
              "name": "億り人・決算速報",
              "url": "https://rich-investor-news.com",
              "logo": "https://rich-investor-news.com/icon.jpg",
              "description": "日本株市場で注目される著名投資家の動向やニュースを自動収集・配信するメディア。",
              "sameAs": []
            })
          }}
        />
      </head>
      <body>
        <Header />
        <div className="app-layout">
          <Sidebar />
          <main className="app-main">
            {children}
          </main>
        </div>
        <footer style={{ marginTop: '4rem', padding: '2rem 1rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: 'var(--secondary)', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <Link href="/introduction" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>投資家一覧</Link>
            <Link href="/request" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>追加リクエスト</Link>
            <Link href="/inquiry" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>お問い合わせ</Link>
            <Link href="/about" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>サイトについて</Link>
            <Link href="/guide" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>使い方ガイド</Link>
            <Link href="/disclaimer" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>運営者情報・公式LINE</Link>
            <Link href="/privacy" style={{ color: 'var(--secondary)', textDecoration: 'none' }}>プライバシーポリシー</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Investor News. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}

