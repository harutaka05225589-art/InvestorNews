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

export function getRevisionsByDateRange(startDate: string, endDate: string, category: string = 'earnings', sector: string | null = null) {
    try {
        let query = `
            SELECT r.*, c.sector 
            FROM revisions r
            LEFT JOIN companies c ON r.ticker = c.ticker
            WHERE r.revision_date BETWEEN ? AND ?
            AND r.is_upward IS NOT NULL
        `;
        const params: any[] = [startDate, endDate];

        if (category === 'earnings') {
            query += ` AND r.category IN ('earnings', 'both')`;
        } else if (category === 'dividend') {
            query += ` AND r.category IN ('dividend', 'both')`;
        } else if (category === 'buyback') {
            query += ` AND r.category = 'buyback'`;
        } else if (category === 'all') {
            // No filter
        } else {
            // Default fallback
            query += ` AND r.category IN ('earnings', 'both')`;
        }

        if (sector) {
            query += ` AND c.sector = ?`;
            params.push(sector);
        }

        query += ` ORDER BY r.revision_date DESC, r.id DESC`;

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

export function getSurpriseRevisions(limit: number = 20) {
    try {
        const stmt = db.prepare(`
            SELECT r.*, c.sector 
            FROM revisions r
            LEFT JOIN companies c ON r.ticker = c.ticker
            WHERE r.revision_rate_op >= 10
            ORDER BY r.revision_date DESC, r.revision_rate_op DESC
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch (e) {
        return [];
    }
}

export function getHotTickers(limit: number = 20) {
    try {
        const stmt = db.prepare(`
            SELECT r.ticker, r.company_name, COUNT(*) as activity_count, MAX(r.revision_date) as last_date, c.sector
            FROM revisions r
            LEFT JOIN companies c ON r.ticker = c.ticker
            WHERE r.revision_date > date('now', '-90 days')
              AND r.is_upward IS NOT NULL
            GROUP BY r.ticker
            ORDER BY activity_count DESC, last_date DESC
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch (e) {
        return [];
    }
}

export function getUpwardRevisionRanking(limit: number = 30) {
    try {
        const stmt = db.prepare(`
            SELECT r.*, c.sector, c.market
            FROM revisions r
            LEFT JOIN companies c ON r.ticker = c.ticker
            WHERE r.revision_rate_op IS NOT NULL AND r.revision_rate_op > 0
            ORDER BY r.revision_date DESC, r.revision_rate_op DESC
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch (e) {
        return [];
    }
}

export function getDividendIncreaseRanking(limit: number = 30) {
    try {
        const stmt = db.prepare(`
            SELECT r.*, c.sector, c.market,
                   ((r.dividend_forecast_annual - r.dividend_forecast_previous) / r.dividend_forecast_previous * 100) as increase_rate
            FROM revisions r
            LEFT JOIN companies c ON r.ticker = c.ticker
            WHERE r.category IN ('dividend', 'both')
              AND r.dividend_forecast_annual > r.dividend_forecast_previous
              AND r.dividend_forecast_previous > 0
            ORDER BY r.revision_date DESC, increase_rate DESC
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch (e) {
        return [];
    }
}

export function getBuybackRanking(limit: number = 30) {
    try {
        const stmt = db.prepare(`
            SELECT r.*, c.sector, c.market
            FROM revisions r
            LEFT JOIN companies c ON r.ticker = c.ticker
            WHERE r.category = 'buyback'
            ORDER BY r.revision_date DESC
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch (e) {
        return [];
    }
}

export function getStocksByRightsMonth(month: number, limit: number = 100) {
    try {
        // Window function to get the latest revision record per ticker that has the target rights month
        const stmt = db.prepare(`
            WITH RankedRevisions AS (
                SELECT r.*, c.sector, c.market, c.name as company_name_c,
                       ROW_NUMBER() OVER(PARTITION BY r.ticker ORDER BY r.revision_date DESC, r.id DESC) as rn
                FROM revisions r
                LEFT JOIN companies c ON r.ticker = c.ticker
                WHERE r.dividend_rights_month = ?
                  AND r.company_name NOT LIKE '%投資法人%'
                  AND r.company_name NOT LIKE '%ＥＴＦ%'
                  AND r.company_name NOT LIKE '%ETF%'
                  AND r.company_name NOT LIKE '%ファンド%'
                  AND r.company_name NOT LIKE '%投信%'
                  AND r.company_name NOT LIKE '%リート%'
                  AND r.company_name NOT LIKE '%ＲＥＩＴ%'
                  AND r.company_name NOT LIKE '%REIT%'
                  AND r.company_name NOT LIKE '%REAT%'
                  AND (c.sector IS NULL OR c.sector NOT IN ('ETF', 'REIT'))
            )
            SELECT * FROM RankedRevisions 
            WHERE rn = 1
            ORDER BY dividend_forecast_annual DESC, revision_date DESC
            LIMIT ?
        `);
        return stmt.all(month, limit) as any[];
    } catch (e) {
        console.error("Error getStocksByRightsMonth:", e);
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

export function getRevisionRateFullRanking(limit: number = 50) {
    try {
        const stmt = db.prepare(`
            SELECT r.*, c.sector, c.market
            FROM revisions r
            LEFT JOIN companies c ON r.ticker = c.ticker
            WHERE r.revision_rate_op IS NOT NULL
            ORDER BY ABS(r.revision_rate_op) DESC
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch (e) {
        return [];
    }
}

export function getEarningsThisWeek() {
    try {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        
        const startStr = startOfWeek.toISOString().split('T')[0];
        const endStr = endOfWeek.toISOString().split('T')[0];

        const stmt = db.prepare(`
            SELECT event_date, ticker, company_name, market
            FROM ir_events
            WHERE event_date BETWEEN ? AND ?
            ORDER BY event_date ASC, ticker ASC
        `);
        return stmt.all(startStr, endStr) as any[];
    } catch (e) {
        console.error("Get earnings this week error:", e);
        return [];
    }
}

export function getInvestorBuyingRanking(limit: number = 30) {
    try {
        // Simple implementation: Latest top holdings by recognizable investors
        // In a real scenario, we would join with previous snapshots to find deltas.
        const stmt = db.prepare(`
            SELECT s.*, p.company_name
            FROM stock_shareholders s
            LEFT JOIN stock_profiles p ON s.ticker = p.ticker
            WHERE s.shareholder_name NOT LIKE '%信託%' 
              AND s.shareholder_name NOT LIKE '%銀行%'
              AND s.shareholder_name NOT LIKE '%証券%'
              AND s.shareholder_name NOT LIKE '%マスタートラスト%'
              AND s.shareholder_name NOT LIKE '%カストディ%'
            ORDER BY s.entry_date DESC, s.share_ratio DESC
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch (e) {
        return [];
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

export function getHoldingsByShareholder(shareholderNames: string[]): (Shareholder & { company_name: string })[] {
    try {
        if (!shareholderNames || shareholderNames.length === 0) return [];

        const placeholders = shareholderNames.map(() => '?').join(',');

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
            WHERE s.shareholder_name IN (${placeholders})
            AND s.entry_date = (
                SELECT MAX(entry_date) 
                FROM stock_shareholders s2 
                WHERE s2.ticker = s.ticker 
                AND s2.shareholder_name = s.shareholder_name
            )
            ORDER BY s.share_ratio DESC
        `);
        return stmt.all(...shareholderNames) as (Shareholder & { company_name: string })[];
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
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) return [];

    let allCompanies: CompanySearchResult[] = [];

    try {
        const stmt = db.prepare(`SELECT ticker, name, market, sector FROM companies`);
        allCompanies = stmt.all() as CompanySearchResult[];
    } catch (e) {
        // Table might not exist yet, fallback to ir_events below
    }

    // 2. Fetch fallbacks if master table empty or missing
    if (allCompanies.length === 0) {
        try {
            const stmt = db.prepare(`
                SELECT ticker, name, 'Unknown' as market, '' as sector FROM (
                    SELECT DISTINCT ticker, company_name as name FROM ir_events
                    UNION
                    SELECT DISTINCT ticker, company_name as name FROM revisions
                )
             `);
            allCompanies = stmt.all() as CompanySearchResult[];
        } catch (e2) {
            console.error("Search fallback error:", e2);
        }
    }

    // 3. Filter in memory (supports any Unicode, NFKC, and JS lowercasing properly)
    const exactMatches: CompanySearchResult[] = [];
    const partialMatches: CompanySearchResult[] = [];

    for (const company of allCompanies) {
        // Protect against null names in fallback sources
        const tickerNorm = normalizeSearchQuery(company.ticker || "");
        const nameNorm = normalizeSearchQuery(company.name || "");

        if (tickerNorm === normalizedQuery) {
            exactMatches.push(company);
        } else if (tickerNorm.includes(normalizedQuery) || nameNorm.includes(normalizedQuery)) {
            partialMatches.push(company);
        }
    }

    // 4. Sort exact matches first, then partials, and limit
    const results = [...exactMatches, ...partialMatches].slice(0, limit);

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

// --- SEO Internal Linking Helpers (Added for YMYL Phase 13) ---
export interface RelatedStock {
    ticker: string;
    company_name: string;
}

export function getRelatedStocksBySector(sector: string, currentTicker: string, limit: number = 5): RelatedStock[] {
    try {
        if (!sector) return [];

        // Fetch current company's latest revenue (sales) to find similar sized rivals
        const stmtCurrent = db.prepare(`
            SELECT sales FROM financial_stats 
            WHERE ticker = ? AND period_type = 'annual' AND sales IS NOT NULL
            ORDER BY period_end DESC LIMIT 1
        `);
        const currentSalesRow = stmtCurrent.get(currentTicker) as { sales: number } | undefined;
        let query = "";
        let params: any[] = [];

        if (currentSalesRow && currentSalesRow.sales > 0) {
            // Find rivals closest in revenue
            query = `
                SELECT c.ticker, c.name as company_name 
                FROM companies c
                LEFT JOIN (
                    SELECT ticker, sales FROM financial_stats 
                    WHERE period_type = 'annual' AND sales IS NOT NULL
                    GROUP BY ticker HAVING MAX(period_end)
                ) f ON c.ticker = f.ticker
                WHERE c.sector = ? AND c.ticker != ?
                ORDER BY ABS(f.sales - ?) ASC
                LIMIT ?
            `;
            params = [sector, currentTicker, currentSalesRow.sales, limit];
        } else {
            // Fallback to random if no financial data
            query = `
                SELECT c.ticker, c.name as company_name 
                FROM companies c
                WHERE c.sector = ? AND c.ticker != ?
                ORDER BY RANDOM()
                LIMIT ?
            `;
            params = [sector, currentTicker, limit];
        }

        const stmt = db.prepare(query);
        return stmt.all(...params) as RelatedStock[];
    } catch (e) {
        console.error("Get related stocks by sector error:", e);
        return [];
    }
}

export function getCompanyByTicker(ticker: string): { ticker: string, name: string, market: string, sector: string } | undefined {
    try {
        const stmt = db.prepare('SELECT ticker, name, market, sector FROM companies WHERE ticker = ?');
        return stmt.get(ticker) as { ticker: string, name: string, market: string, sector: string } | undefined;
    } catch (e) {
        console.error("Get company by ticker error:", e);
        return undefined;
    }
}
// --- Market Summary Helpers ---

export interface MarketSummary {
    date: string;
    summary_text: string;
    generated_at: string;
}

export function getMarketSummary(dateStr?: string): MarketSummary | null {
    try {
        let stmt;
        if (dateStr) {
            stmt = db.prepare('SELECT * FROM market_summaries WHERE date = ?');
            return stmt.get(dateStr) as MarketSummary || null;
        } else {
            // Get the latest one if no date specified
            stmt = db.prepare('SELECT * FROM market_summaries ORDER BY date DESC LIMIT 1');
            return stmt.get() as MarketSummary || null;
        }
    } catch (e) {
        console.error("Get market summary error:", e);
        return null;
    }
}

// --- UGC Voting System (Pillar 4) ---

export function submitUserVote(userId: string, ticker: string, voteType: 'bull' | 'bear', comment?: string) {
    try {
        const stmt = db.prepare(`
            INSERT INTO user_votes (user_id, ticker, vote_type, comment)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, ticker) DO UPDATE SET 
                vote_type = excluded.vote_type,
                comment = CASE WHEN excluded.comment IS NOT NULL AND excluded.comment != '' THEN excluded.comment ELSE user_votes.comment END,
                created_at = CURRENT_TIMESTAMP
        `);
        stmt.run(userId, ticker, voteType, comment || null);
    } catch (e) {
        console.error("Submit user vote error:", e);
    }
}

export function getUserVote(userId: string, ticker: string) {
    try {
        const stmt = db.prepare('SELECT vote_type, comment FROM user_votes WHERE user_id = ? AND ticker = ?');
        const result = stmt.get(userId, ticker) as { vote_type: 'bull' | 'bear', comment: string | null } | undefined;
        return result || null;
    } catch (e) {
        console.error("Get user vote error:", e);
        return null;
    }
}

export function getVoteStats(ticker: string) {
    try {
        const stmt = db.prepare(`
            SELECT 
                SUM(CASE WHEN vote_type = 'bull' THEN 1 ELSE 0 END) as bull_count,
                SUM(CASE WHEN vote_type = 'bear' THEN 1 ELSE 0 END) as bear_count
            FROM user_votes 
            WHERE ticker = ?
        `);
        const result = stmt.get(ticker) as { bull_count: number; bear_count: number } | undefined;
        if (!result) return { bull_count: 0, bear_count: 0, total: 0, bull_percent: 0 };
        
        const bull = result.bull_count || 0;
        const bear = result.bear_count || 0;
        const total = bull + bear;
        const bull_percent = total > 0 ? Math.round((bull / total) * 100) : 0;
        
        return { bull_count: bull, bear_count: bear, total, bull_percent };
    } catch (e) {
        console.error("Get vote stats error:", e);
        return { bull_count: 0, bear_count: 0, total: 0, bull_percent: 0 };
    }
}

export function getRecentComments(ticker: string, limit: number = 10) {
    try {
        const stmt = db.prepare(`
            SELECT v.vote_type, v.comment, v.created_at, u.nickname as user_name
            FROM user_votes v
            LEFT JOIN users u ON v.user_id = u.id
            WHERE v.ticker = ? AND v.comment IS NOT NULL AND v.comment != ''
            ORDER BY v.created_at DESC
            LIMIT ?
        `);
        return stmt.all(ticker, limit) as any[];
    } catch (e) {
        console.error("Get recent comments error:", e);
        return [];
    }
}

export function getTrendingVotes(limit: number = 5) {
    try {
        const stmt = db.prepare(`
            SELECT v.ticker, c.name, COUNT(*) as bull_count
            FROM user_votes v
            LEFT JOIN companies c ON v.ticker = c.ticker
            WHERE v.vote_type = 'bull' 
              AND v.created_at >= datetime('now', '-7 days')
            GROUP BY v.ticker
            ORDER BY bull_count DESC
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch(e) {
        console.error("Get trending votes error:", e);
        return [];
    }
}


// --- Pillar 2: Daily Reports (Discover) ---

export function getDailyReport(dateStr: string) {
    try {
        const stmt = db.prepare('SELECT * FROM daily_reports WHERE date_str = ?');
        return stmt.get(dateStr) as any;
    } catch (e) {
        console.error("Get daily report error:", e);
        return null;
    }
}

export function getRecentReports(limit: number = 30) {
    try {
        const stmt = db.prepare('SELECT * FROM daily_reports ORDER BY date_str DESC LIMIT ?');
        return stmt.all(limit) as any[];
    } catch (e) {
        console.error("Get recent reports error:", e);
        return [];
    }
}

// --- Pillar 3: Viral Portfolio Share ---

export function getUserByAccountId(accountId: string) {
    try {
        const stmt = db.prepare('SELECT id, nickname FROM users WHERE account_id = ?');
        return stmt.get(accountId) as { id: number, nickname: string } | undefined;
    } catch(e) {
        console.error(e);
        return undefined;
    }
}

export function getSharedPortfolioData(userId: number) {
    try {
        const transactions = getPortfolioTransactions(userId);
        
        // Very basic server-side aggregate calculation
        const map = new Map<string, any>();
        let totalInvested = 0;
        let totalNetDividend = 0;

        transactions.forEach(tx => {
            const key = `${tx.ticker}-${tx.account_type}`;
            if (!map.has(key)) {
                const divInfo = getLatestDividend(tx.ticker);
                map.set(key, {
                    ticker: tx.ticker,
                    name: divInfo.companyName || tx.ticker,
                    accountType: tx.account_type,
                    totalShares: 0,
                    averagePrice: 0,
                    invested: 0,
                    divAmount: divInfo.amount || 0
                });
            }
            const current = map.get(key);
            if (tx.shares > 0) {
                current.totalShares += tx.shares;
                current.invested += (tx.shares * tx.price);
                current.averagePrice = current.totalShares > 0 ? current.invested / current.totalShares : 0;
            } else {
                current.totalShares -= Math.abs(tx.shares);
                current.invested = current.totalShares * current.averagePrice;
                if (current.totalShares <= 0) {
                    current.totalShares = 0;
                    current.invested = 0;
                }
            }
        });

        const holdings = Array.from(map.values()).filter(h => h.totalShares > 0);
        
        holdings.forEach(h => {
            totalInvested += h.invested;
            const grossDiv = h.totalShares * h.divAmount;
            const taxRate = h.accountType === 'nisa' ? 0 : 0.20315;
            totalNetDividend += (grossDiv * (1 - taxRate));
            h.netDividend = grossDiv * (1 - taxRate);
        });

        return { holdings, totalInvested, totalNetDividend };

    } catch(e) {
        console.error(e);
        return { holdings: [], totalInvested: 0, totalNetDividend: 0 };
    }
}


export function getRevisionHistory(ticker: string, limit: number = 10) {
    try {
        const stmt = db.prepare(`
            SELECT 
                revision_date, 
                previous_forecast_op, 
                new_forecast_op, 
                revision_rate_op, 
                is_upward
            FROM revisions
            WHERE ticker = ? AND new_forecast_op IS NOT NULL
            ORDER BY revision_date ASC
            LIMIT ?
        `);
        return stmt.all(ticker, limit) as any[];
    } catch(e) {
        console.error("Get revision history error:", e);
        return [];
    }
}
