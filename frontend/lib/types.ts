export interface Investor {
    id: number;
    name: string;
    aliases: string;
    style_description: string;
    twitter_url: string;
    image_url: string;
    profile?: string;
    news_count?: number;
}

export interface NewsItem {
    id: number;
    investor_id: number;
    title: string;
    url: string;
    summary: string;
    domain: string;
    is_paid: number; // SQLite returns 1/0
    published_at: string;
    ai_summary?: string;
}
