import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Investor, NewsItem } from './types';

// Robust DB Path Resolution
const possiblePaths = [
    path.join(process.cwd(), 'investor_news.db'),
    path.join(process.cwd(), '..', 'investor_news.db'), // Check parent directory (Root)
    path.join(process.cwd(), 'frontend', 'investor_news.db')
];

// Prefer the one that exists and has data
let dbPath = possiblePaths[0]; // Default
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        dbPath = p;
        break;
    }
}
console.log(`[DB] Using database at: ${dbPath}`);

let db: ReturnType<typeof Database>;

try {
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');
} catch (error) {
    console.error("Failed to connect to database at", dbPath, error);
    throw error;
}


export default db;

// --- Portfolio Helpers ---

export interface PortfolioTransaction {
    id: number;
    user_id: number;
    ticker: string;
    shares: number;
    price: number;
    transaction_date: string | null;
    account_type: 'nisa' | 'general';
    created_at: string;
}

export function addPortfolioTransaction(userId: number, ticker: string, shares: number, price: number, date: string | null, accountType: string) {
    try {
        const stmt = db.prepare(`
            INSERT INTO portfolio_transactions (user_id, ticker, shares, price, transaction_date, account_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(userId, ticker, shares, price, date, accountType);
    } catch (e) {
        console.error("Add transaction error:", e);
        throw e;
    }
}

export function getPortfolioTransactions(userId: number): PortfolioTransaction[] {
    try {
        const stmt = db.prepare(`
            SELECT * FROM portfolio_transactions
            WHERE user_id = ?
            ORDER BY transaction_date DESC, created_at DESC
        `);
        return stmt.all(userId) as PortfolioTransaction[];
    } catch (e) {
        console.error("Get transactions error:", e);
        return [];
    }
}

export function deletePortfolioTransaction(transactionId: number, userId: number) {
    try {
        const stmt = db.prepare('DELETE FROM portfolio_transactions WHERE id = ? AND user_id = ?');
        return stmt.run(transactionId, userId);
    } catch (e) {
        console.error("Delete transaction error:", e);
        throw e;
    }
}

// --- Dividend Helpers ---

export interface DividendInfo {
    amount: number;
    rightsMonth: number | null;
    paymentMonth: number | null;
    companyName: string | null;
}

export function getLatestDividend(ticker: string): DividendInfo {
    try {
        // 1. Try Revisions (Primary Source)
        // Relaxed query: match if EITHER forecast OR months are present
        const stmt = db.prepare(`
            SELECT dividend_forecast_annual, dividend_rights_month, dividend_payment_month, company_name
            FROM revisions 
            WHERE ticker = ? AND (dividend_forecast_annual IS NOT NULL OR dividend_rights_month IS NOT NULL)
            ORDER BY revision_date DESC, id DESC
            LIMIT 1
        `);
        const row = stmt.get(ticker) as {
            dividend_forecast_annual: number | null,
            dividend_rights_month: number | null,
            dividend_payment_month: number | null,
            company_name: string
        } | undefined;

        let amount = row?.dividend_forecast_annual || 0;
        let rightsMonth = row?.dividend_rights_month || null;
        let paymentMonth = row?.dividend_payment_month || null;
        let companyName = row?.company_name || null;

        // 2. Fallback for AMOUNT: Check Dividend History if revision amount is missing
        if (!amount) {
            try {
                const histStmt = db.prepare(`
                    SELECT dividend_amount 
                    FROM dividend_history 
                    WHERE ticker = ? AND is_forecast = 1
                    ORDER BY period DESC 
                    LIMIT 1
                `);
                const histRow = histStmt.get(ticker) as { dividend_amount: number } | undefined;
                if (histRow) {
                    amount = histRow.dividend_amount;
                }
            } catch (e) { }
        }

        // 3. Fallback for NAME if still missing
        if (!companyName) {
            try {
                const nameStmt2 = db.prepare('SELECT company_name FROM stock_profiles WHERE ticker = ?');
                const nameRow2 = nameStmt2.get(ticker) as { company_name: string } | undefined;
                if (nameRow2) companyName = nameRow2.company_name;
                else {
                    const nameStmt3 = db.prepare('SELECT company_name FROM ir_events WHERE ticker = ? LIMIT 1');
                    const nameRow3 = nameStmt3.get(ticker) as { company_name: string } | undefined;
                    if (nameRow3) companyName = nameRow3.company_name;
                }
            } catch (e) { }
        }

        return {
            amount,
            rightsMonth,
            paymentMonth,
            companyName
        };


        // 3. Last Fallback: Just get name
        try {
            const nameStmt = db.prepare('SELECT company_name FROM ir_events WHERE ticker = ? LIMIT 1');
            const nameRow = nameStmt.get(ticker) as { company_name: string } | undefined;
            if (nameRow) {
                return { amount: 0, rightsMonth: null, paymentMonth: null, companyName: nameRow!.company_name };
            }
        } catch (e) { /* ignore */ }

        return { amount: 0, rightsMonth: null, paymentMonth: null, companyName: null };
    } catch (e) {
        console.error("Get latest dividend error:", e);
        return { amount: 0, rightsMonth: null, paymentMonth: null, companyName: null };
    }
}


export function getDividendHistory(ticker: string) {
    try {
        const stmt = db.prepare(`
            SELECT period, dividend_amount, is_forecast
            FROM dividend_history
            WHERE ticker = ?
            ORDER BY period ASC
        `);
        return stmt.all(ticker) as { period: string, dividend_amount: number, is_forecast: number }[];
    } catch (e) {
        console.error("Get dividend history error:", e);
        return [];
    }
}


// --- Data Fetching Helpers ---

export function getInvestors(): Investor[] {
    const stmt = db.prepare(`
        SELECT
            i.id, i.name, i.aliases, i.style_description,
            i.twitter_url, i.image_url, i.profile,
            (SELECT COUNT(*) FROM news_items n WHERE n.investor_id = i.id) as news_count
        FROM investors i
    `);
    return stmt.all() as Investor[];
}

export function getInvestorById(id: string | number): Investor | undefined {
    // profile is already selected by *
    const stmt = db.prepare('SELECT * FROM investors WHERE id = ?');
    return stmt.get(id) as Investor | undefined;
}

export function getNewsByInvestor(investorId: string | number, page: number = 1, limit: number = 20): { news: NewsItem[], total: number } {
    const offset = (page - 1) * limit;

    const stmt = db.prepare(`
        SELECT * FROM news_items 
        WHERE investor_id = ? 
        ORDER BY published_at DESC 
        LIMIT ? OFFSET ?
    `);
    const news = stmt.all(investorId, limit, offset) as NewsItem[];

    const countStmt = db.prepare('SELECT COUNT(*) as total FROM news_items WHERE investor_id = ?');
    const total = (countStmt.get(investorId) as { total: number }).total;



    return { news, total };
}

export function getDailyIREvents(dateStr: string): { count: number, events: { ticker: string, name: string }[] } {
    try {
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM ir_events WHERE event_date = ?');
        const count = (countStmt.get(dateStr) as { count: number }).count;

        const eventsStmt = db.prepare('SELECT ticker, company_name as name, market FROM ir_events WHERE event_date = ? LIMIT 5');
        const events = eventsStmt.all(dateStr) as { ticker: string, name: string, market: string | null }[];

        return { count, events };
    } catch (e) {
        console.error("Error fetching daily IR events:", e);
        return { count: 0, events: [] };
    }
}

export function getLatestEdinetDocs(limit: number = 3) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM edinet_documents 
            ORDER BY submitted_at DESC 
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch (e) {
        return [];
    }
}

export function getRevisions(limit: number = 100) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM revisions 
            WHERE title NOT IN ('System_Dividend_Update', 'YahooFinance_Initial')
             AND (title LIKE '%業績%' OR title LIKE '%差異%' OR title LIKE '%配当%' OR title LIKE '%剰余金%' OR title LIKE '%自己株式%')
            AND is_upward IS NOT NULL
            ORDER BY revision_date DESC, id DESC
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch (e) {
        return [];
    }
}

export function getRevisionsByDateRange(startDate: string, endDate: string, category: string = 'earnings') {
    try {
        let query = `
            SELECT * FROM revisions 
            WHERE revision_date BETWEEN ? AND ?
            AND is_upward IS NOT NULL
        `;
        const params: any[] = [startDate, endDate];

        if (category === 'earnings') {
            query += ` AND category IN ('earnings', 'both')`;
        } else if (category === 'dividend') {
            query += ` AND category IN ('dividend', 'both')`;
        } else if (category === 'buyback') {
            query += ` AND category = 'buyback'`;
        } else if (category === 'all') {
            // No filter
        } else {
            // Default fallback if unknown (safe)
            query += ` AND category IN ('earnings', 'both')`;
        }

        query += ` ORDER BY revision_date DESC, id DESC`;

        const stmt = db.prepare(query);
        return stmt.all(...params) as any[];
    } catch (e) {
        return [];
    }
}

export function getRevisionRanking(limit: number = 20) {
    // Rank companies by number of revisions (Active Revisers)
    // Since we don't have rate data yet, frequency is a good proxy for "Volatile/Active" stocks
    try {
        const stmt = db.prepare(`
            SELECT ticker, company_name, COUNT(*) as count 
            FROM revisions 
            WHERE is_upward IS NOT NULL
            GROUP BY ticker, company_name 
            ORDER BY count DESC 
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch (e) {
        return [];
    }
}
export function getRevisionsByTicker(ticker: string, limit: number = 5, excludeId: number | null = null) {
    try {
        let query = 'SELECT * FROM revisions WHERE ticker = ? AND is_upward IS NOT NULL';
        const params: any[] = [ticker];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        query += ' ORDER BY revision_date DESC, id DESC LIMIT ?';
        params.push(limit);

        const stmt = db.prepare(query);
        return stmt.all(...params) as any[];
    } catch (e) {
        return [];
    }
}

export function searchRevisions(query: string, limit: number = 50) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM revisions 
            WHERE (ticker LIKE ? OR company_name LIKE ?)
            AND (title LIKE '%業績%' OR title LIKE '%差異%')
            AND is_upward IS NOT NULL
            ORDER BY revision_date DESC, id DESC 
            LIMIT ?
        `);
        const searchPattern = `%${query}%`;
        return stmt.all(searchPattern, searchPattern, limit) as any[];
    } catch (e) {
        console.error("Search revisions error:", e);
        return [];
    }
}

export function getRevisionsForSitemap(limit: number = 1000) {
    try {
        const stmt = db.prepare(`
            SELECT id, revision_date FROM revisions 
            ORDER BY revision_date DESC, id DESC
            LIMIT ?
        `);
        return stmt.all(limit) as { id: number, revision_date: string }[];
    } catch (e) {
        return [];
    }
}

export function getRevisionById(id: string | number) {
    try {
        const stmt = db.prepare('SELECT * FROM revisions WHERE id = ?');
        return stmt.get(id) as any;
    } catch (e) {
        return null;
    }
}

// --- Stock Profile Helpers ---

export interface StockProfile {
    ticker: string;
    company_name: string;
    description: string | null;
    sector: string | null;
    website_url: string | null;
    updated_at: string;
}

export function getStockProfile(ticker: string): StockProfile | undefined {
    try {
        const stmt = db.prepare('SELECT * FROM stock_profiles WHERE ticker = ?');
        return stmt.get(ticker) as StockProfile | undefined;
    } catch (e) {
        console.error("Get stock profile error:", e);
        return undefined;
    }
}

// --- Financial Stats Helpers ---

export interface FinancialStat {
    ticker: string;
    period_type: 'annual' | 'quarter';
    period_end: string;
    sales: number;
    operating_profit: number;
    ordinary_profit: number;
    net_profit: number;
    eps: number;
    is_forecast: number;
    source: string;
}

export function getFinancialStats(ticker: string): FinancialStat[] {
    try {
        const stmt = db.prepare(`
            SELECT * FROM financial_stats 
            WHERE ticker = ?
            ORDER BY period_end DESC
        `);
        return stmt.all(ticker) as FinancialStat[];
    } catch (e) {
        console.error("Get financial stats error:", e);
        return [];
    }
}

// --- Shareholder Helpers ---

export interface Shareholder {
    ticker: string;
    entry_date: string; // YYYY-MM-DD
    shareholder_name: string;
    share_count: string;
    share_ratio: number;
    rank: number;
}

export function getShareholders(ticker: string): Shareholder[] {
    try {
        // Fetch all history
        const stmt = db.prepare(`
            SELECT * FROM stock_shareholders 
            WHERE ticker = ?
            ORDER BY entry_date DESC, rank ASC
        `);
        return stmt.all(ticker) as Shareholder[];
    } catch (e) {
        console.error("Get shareholders error:", e);
        return [];
    }
}

export function getHoldingsByShareholder(shareholderName: string): (Shareholder & { company_name: string })[] {
    try {
        // Get the latest entry for each ticker this shareholder owns
        const stmt = db.prepare(`
            SELECT 
                s.ticker, 
                s.entry_date, 
                s.shareholder_name, 
                s.share_count, 
                s.share_ratio, 
                s.rank,
                COALESCE(p.company_name, s.ticker) as company_name
            FROM stock_shareholders s
            LEFT JOIN stock_profiles p ON s.ticker = p.ticker
            WHERE s.shareholder_name = ?
            AND s.entry_date = (
                SELECT MAX(entry_date) 
                FROM stock_shareholders s2 
                WHERE s2.ticker = s.ticker 
                AND s2.shareholder_name = s.shareholder_name
            )
            ORDER BY s.share_ratio DESC
        `);
        return stmt.all(shareholderName) as (Shareholder & { company_name: string })[];
    } catch (e) {
        console.error("Get holdings by shareholder error:", e);
        return [];
    }
}

// --- Company Search Helpers (Added 2026-02-08) ---

export interface CompanySearchResult {
    ticker: string;
    name: string;
    market: string | null;
    sector: string | null;
}

function normalizeSearchQuery(query: string): string {
    // 1. Convert Full-width Alphanumeric to Half-width, and normalize Unicode
    // 2. Convert to lowercase for case-insensitive matching
    return query.normalize('NFKC').toLowerCase().trim();
}

export function searchCompanies(query: string, limit: number = 10): CompanySearchResult[] {
    let results: CompanySearchResult[] = [];
    const normalizedQuery = normalizeSearchQuery(query);
    const searchPattern = `%${normalizedQuery}%`;

    // 1. Try "companies" master table
    try {
        const stmt = db.prepare(`
            SELECT code as ticker, name, market_segment as market, '' as sector 
            FROM companies 
            WHERE code LIKE ? OR name LIKE ?
            ORDER BY 
              CASE WHEN code = ? THEN 1 ELSE 2 END, -- Exact match first
              code ASC
            LIMIT ?
        `);
        results = stmt.all(searchPattern, searchPattern, normalizedQuery, limit) as CompanySearchResult[];
    } catch (e) {
        // Table might not exist yet, ignore
    }

    // 2. Fallback to "ir_events" if no results found (or table missing)
    if (results.length === 0) {
        try {
            const stmt = db.prepare(`
                SELECT ticker, name, 'Unknown' as market, '' as sector FROM (
                    SELECT DISTINCT ticker, company_name as name FROM ir_events
                    WHERE ticker LIKE ? OR company_name LIKE ?
                    UNION
                    SELECT DISTINCT ticker, company_name as name FROM revisions
                    WHERE ticker LIKE ? OR company_name LIKE ?
                )
                ORDER BY ticker
                LIMIT ?
             `);
            results = stmt.all(searchPattern, searchPattern, searchPattern, searchPattern, limit) as CompanySearchResult[];
        } catch (e2) {
            console.error("Search fallback error:", e2);
        }
    }


    return results;
}

export function getAllCompanies(): { ticker: string }[] {
    try {
        // Try active companies from companies table
        const stmt = db.prepare('SELECT ticker FROM companies ORDER BY ticker');
        const res = stmt.all() as { ticker: string }[];
        if (res.length > 0) return res;
    } catch (e) { }

    // Fallback: Get unique tickers from stock_profiles
    try {
        const stmt = db.prepare('SELECT ticker FROM stock_profiles ORDER BY ticker');
        return stmt.all() as { ticker: string }[];
    } catch (e) {
        return [];
    }
}

