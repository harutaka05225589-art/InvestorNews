import { getRecentReports } from '@/lib/db';

export async function GET() {
    // Google News requires articles published in the last 2 days (48 hours)
    // For simplicity, we fetch the most recent ones.
    const reports = getRecentReports(10);
    const BASE_URL = 'https://rich-investor-news.com';

    const xmlUrls = reports.map((report: any) => {
        // Ensuring created_at is valid ISO for Google News
        let dateStr = report.created_at;
        if (!dateStr.includes('T')) {
            // simple conversion if it's 'YYYY-MM-DD HH:MM:SS'
            dateStr = dateStr.replace(' ', 'T') + '+09:00'; // Assuming JST
        }

        return `
    <url>
        <loc>${BASE_URL}/daily-reports/${report.date_str}</loc>
        <news:news>
            <news:publication>
                <news:name>億り人・決算速報</news:name>
                <news:language>ja</news:language>
            </news:publication>
            <news:publication_date>${dateStr}</news:publication_date>
            <news:title>${report.title}</news:title>
        </news:news>
    </url>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${xmlUrls}
</urlset>
`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
        },
    });
}
