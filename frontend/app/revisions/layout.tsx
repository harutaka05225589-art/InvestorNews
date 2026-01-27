
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '業績修正速報 | Invester News',
    description: 'AIが企業の決算修正（上方修正・下方修正）を自動解析。ポジティブなサプライズをいち早くキャッチします。',
    openGraph: {
        title: '業績修正速報 - AI決算分析',
        description: '上場企業の決算修正をAIがリアルタイム分析。注目の上方修正銘柄をランキング形式で配信。',
        images: [
            {
                url: '/api/og?title=業績修正速報&subtitle=AIによる決算分析・サプライズ検知&type=alert',
                width: 1200,
                height: 630,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '業績修正速報 | Invester News',
        description: 'AIが企業の決算修正（上方修正・下方修正）を自動解析。',
        images: ['/api/og?title=業績修正速報&subtitle=AIによる決算分析・サプライズ検知&type=alert'],
    },
};

export default function RevisionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
