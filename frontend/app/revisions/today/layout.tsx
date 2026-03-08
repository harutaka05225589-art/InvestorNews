import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '今日の業績修正速報｜上方修正・下方修正銘柄一覧（AI要約付き） | 億り人・決算速報',
    description: '本日発表された全上場企業の業績修正（上方修正・下方修正・配当修正）をリアルタイムで一覧化。「明日の急騰期待銘柄探し」にご活用ください。AIが修正理由を一目でわかるように解説します。',
    openGraph: {
        title: '今日の業績修正速報｜上方修正・下方修正銘柄一覧',
        description: '本日発表された全上場企業の業績修正（上方修正・下方修正・配当修正）をリアルタイムで一覧化。「明日の急騰期待銘柄探し」にご活用ください。AIが修正理由を一目でわかるように解説します。',
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: '今日の業績修正速報｜上方修正・下方修正銘柄一覧',
        description: '本日発表された全上場企業の業績修正をリアルタイムで一覧化。AIが修正理由を要約解説します。',
    },
};

export default function TodayRevisionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* JSON-LD structure for Hub Page targeting YMYL keywords */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "今日の業績修正速報｜上方修正・下方修正銘柄一覧（AI要約付き）",
                        "description": "本日発表された全上場企業の業績修正（上方修正・下方修正・配当修正）をリアルタイムで一覧化。明日の急騰期待銘柄探しに。",
                        "publisher": {
                            "@type": "Organization",
                            "name": "億り人・決算速報"
                        }
                    })
                }}
            />
            {children}
        </>
    );
}
