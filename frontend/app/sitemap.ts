import { getAllCompanies, getInvestors, getRevisionsForSitemap } from '@/lib/db';
import { Investor } from '@/lib/types';
import { MetadataRoute } from 'next';

const BASE_URL = 'https://rich-investor-news.com';

export default function sitemap(): MetadataRoute.Sitemap {
    const investors = getInvestors() as Investor[];
    // Get last 5000 revisions to ensure deep indexing
    // SEO Strategy: Target long-tail keywords for specific past events
    const revisions = getRevisionsForSitemap(5000);

    // Dynamic Routes: Investor News Page
    const investorNewsUrls = investors.map((investor) => ({
        url: `${BASE_URL}/investors/${investor.id}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    // Dynamic Routes: Revisions Page
    const revisionUrls = revisions.map((rev: any) => ({
        url: `${BASE_URL}/revisions/${rev.id}`,
        lastModified: new Date(rev.revision_date), // Use revision date as last modified
        changeFrequency: 'never' as const, // Revision content rarely changes once published
        priority: 0.7,
    }));

    // Dynamic Routes: Investor Introduction Article Page
    const investorIntroUrls = investors.map((investor) => ({
        url: `${BASE_URL}/introduction/${investor.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const, // Content changes less often than news
        priority: 0.9,
    }));

    // Dynamic Routes: Stock Detail Page
    const allCompanies = getAllCompanies();
    const stockUrls = allCompanies.map((c) => ({
        url: `${BASE_URL}/stocks/${c.ticker}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const, // Financial data changes quarterly, stock price daily but we don't index daily price
        priority: 0.8,
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
            url: `${BASE_URL}/revisions/ranking/upside`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/revisions/ranking/dividend`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/revisions/ranking/buyback`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/revisions/ranking/surprise`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/revisions/ranking/hot`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/upward-revision-stocks`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/dividend-increase-stocks`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/share-buyback-stocks`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
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
        // {
        //     url: `${BASE_URL}/plans`,
        //     lastModified: new Date(),
        //     changeFrequency: 'monthly' as const,
        //     priority: 0.8,
        // },
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
        {
            url: `${BASE_URL}/about-ai`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        },
    ];

    // Sector Routes (High Value SEO siloing)
    const sectors = [
        'info-telecom', 'services', 'retail', 'wholesale', 'machinery',
        'electric', 'construction', 'pharma', 'chemicals', 'foods',
        'real-estate', 'banking'
    ];
    const sectorUrls = sectors.map(s => ({
        url: `${BASE_URL}/revisions/sector/${s}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7
    }));

    return [
        ...staticRoutes,
        ...sectorUrls,
        ...investorIntroUrls,
        ...investorNewsUrls,
        ...revisionUrls,
        ...stockUrls,
    ];
}
