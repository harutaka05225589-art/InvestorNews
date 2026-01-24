import { getInvestors } from '@/lib/db';
import { Investor } from '@/lib/types';
import { MetadataRoute } from 'next';

const BASE_URL = 'https://rich-investor-news.com';

export default function sitemap(): MetadataRoute.Sitemap {
    const investors = getInvestors() as Investor[];

    // Dynamic Routes: Investor News Page
    const investorNewsUrls = investors.map((investor) => ({
        url: `${BASE_URL}/investors/${investor.id}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    // Dynamic Routes: Investor Introduction Article Page
    const investorIntroUrls = investors.map((investor) => ({
        url: `${BASE_URL}/introduction/${investor.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const, // Content changes less often than news
        priority: 0.9,
    }));

    // Static Routes
    const staticRoutes = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'hourly' as const,
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/calendar`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/introduction`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/alerts`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/request`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/inquiry`,
            lastModified: new Date(),
            changeFrequency: 'yearly' as const,
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/revisions`,
            lastModified: new Date(),
            changeFrequency: 'hourly' as const,
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/revisions/ranking`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/revisions/today`,
            lastModified: new Date(),
            changeFrequency: 'hourly' as const,
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/revisions/this-month`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/plans`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/guide`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/reports`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/settings`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly' as const,
            priority: 0.3,
        },
    ];

    return [
        ...staticRoutes,
        ...investorIntroUrls,
        ...investorNewsUrls,
    ];
}
