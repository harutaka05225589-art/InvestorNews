import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'IRカレンダー | 億り人・決算速報',
    description: '上場企業の決算発表、IPO上場日をカレンダー形式で確認できます。',
    openGraph: {
        title: 'IRカレンダー(決算・IPO予定) | 億り人・決算速報',
        description: '来週の注目決算は？IPOの上場日は？投資家必須のイベントカレンダー。',
        images: ['https://rich-investor-news.com/api/og?title=IR%E3%82%AB%E3%83%AC%E3%83%B3%E3%83%80%E3%83%BC&subtitle=%E6%B3%A8%E7%9B%AE%E6%A0%AA%E3%81%AE%E6%B1%BA%E7%AE%97%E3%82%92%E3%83%81%E3%82%A7%E3%83%83%E3%82%AF'],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'IRカレンダー | 億り人・決算速報',
        description: '来週の注目決算は？IPOの上場日は？',
        images: ['https://rich-investor-news.com/api/og?title=IR%E3%82%AB%E3%83%AC%E3%83%B3%E3%83%80%E3%83%BC&subtitle=%E6%B3%A8%E7%9B%AE%E6%A0%AA%E3%81%AE%E6%B1%BA%E7%AE%97%E3%82%92%E3%83%81%E3%82%A7%E3%83%83%E3%82%AF'],
    },
};

export default function CalendarLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
