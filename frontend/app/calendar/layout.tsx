
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '決算カレンダー | Invester News',
    description: '注目の決算発表スケジュールを網羅。億り人の保有銘柄や大型株の決算日程をチェックできます。',
    openGraph: {
        title: '決算カレンダー - 注目イベント',
        description: '主要企業の決算スケジュールをカレンダー形式で確認。',
        images: [
            {
                url: '/api/og?title=決算カレンダー&subtitle=注目企業の発表スケジュール&type=calendar',
                width: 1200,
                height: 630,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '決算カレンダー | Invester News',
        description: '注目の決算発表スケジュールを網羅。',
        images: ['/api/og?title=決算カレンダー&subtitle=注目企業の発表スケジュール&type=calendar'],
    },
};

export default function CalendarLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
