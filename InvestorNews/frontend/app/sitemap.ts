import { getInvestors } from '@/lib/db';
import { Investor } from '@/lib/types';
import { MetadataRoute } from 'next';

const BASE_URL = 'https://investor-news-demo.vercel.app'; // Replace with actual domain

export default function sitemap(): MetadataRoute.Sitemap {
    const investors = getInvestors() as Investor[];

    const investorUrls = investors.map((investor) => ({
        url: `${BASE_URL}/investors/${investor.id}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    return [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 1,
        },
        ...investorUrls,
    ];
}
