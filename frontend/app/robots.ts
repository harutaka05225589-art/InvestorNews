import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: ['/', '/api/og'],
            disallow: ['/admin/', '/settings/', '/portfolio/', '/alerts/', '/auth/', '/plans/', '/api/'],
        },
        sitemap: 'https://rich-investor-news.com/sitemap.xml',
    };
}
