import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '業績修正速報 | 億り人・決算速報',
    description: 'AIが上方修正・下方修正を自動判定。PDFを開かずに理由がわかる速報リスト。',
    openGraph: {
        title: '業績修正速報(AI要約) | 億り人・決算速報',
        description: '「上方修正」をリアルタイムでキャッチ。AI要約で理由も3行でチェック！',
        images: ['https://rich-investor-news.com/api/og?title=%E6%A5%AD%E7%B8%BE%E4%BF%AE%E6%AD%A3%E9%80%9F%E5%A0%B1&subtitle=%E4%B8%8A%E6%96%B9%E4%BF%AE%E6%AD%A3%E3%82%92AI%E3%81%8C%E7%9E%AC%E6%99%82%E3%81%AB%E8%A6%81%E7%B4%84'],
    },
    twitter: {
        card: 'summary_large_image',
        title: '業績修正速報 | 億り人・決算速報',
        description: '「上方修正」をリアルタイムでキャッチ。',
        images: ['https://rich-investor-news.com/api/og?title=%E6%A5%AD%E7%B8%BE%E4%BF%AE%E6%AD%A3%E9%80%9F%E5%A0%B1&subtitle=%E4%B8%8A%E6%96%B9%E4%BF%AE%E6%AD%A3%E3%82%92AI%E3%81%8C%E7%9E%AC%E6%99%82%E3%81%AB%E8%A6%81%E7%B4%84'],
    },
};

export default function RevisionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
