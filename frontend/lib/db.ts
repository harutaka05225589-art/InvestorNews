import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Investor, NewsItem } from './types';

// Robust DB Path Resolution
const possiblePaths = [
    path.join(process.cwd(), 'investor_news.db'),
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
        const stmt = db.prepare(`
            SELECT dividend_forecast_annual, dividend_rights_month, dividend_payment_month, company_name
            FROM revisions 
            WHERE ticker = ? 
            ORDER BY revision_date DESC, id DESC
            LIMIT 1
        `);
        const row = stmt.get(ticker) as {
            dividend_forecast_annual: number | null,
            dividend_rights_month: number | null,
            dividend_payment_month: number | null,
            company_name: string
        } | undefined;

        if (row) {
            return {
                amount: row.dividend_forecast_annual || 0,
                rightsMonth: row.dividend_rights_month,
                paymentMonth: row.dividend_payment_month,
                companyName: row.company_name
            };
        }

        // Fallback: Try fetching just name from ir_events if revision not found
        try {
            const nameStmt = db.prepare('SELECT company_name FROM ir_events WHERE ticker = ? LIMIT 1');
            const nameRow = nameStmt.get(ticker) as { company_name: string } | undefined;
            if (nameRow) {
                return { amount: 0, rightsMonth: null, paymentMonth: null, companyName: nameRow.company_name };
            }
        } catch (e) { /* ignore */ }

        return { amount: 0, rightsMonth: null, paymentMonth: null, companyName: null };
    } catch (e) {
        console.error("Get latest dividend error:", e);
        return { amount: 0, rightsMonth: null, paymentMonth: null, companyName: null };
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
            ORDER BY revision_date DESC, id DESC
            LIMIT ?
        `);
        return stmt.all(limit) as any[];
    } catch (e) {
        return [];
    }
}

export function getRevisionsByDateRange(startDate: string, endDate: string) {
    try {
        const stmt = db.prepare(`
            SELECT * FROM revisions 
            WHERE revision_date BETWEEN ? AND ?
            ORDER BY revision_date DESC, id DESC
        `);
        return stmt.all(startDate, endDate) as any[];
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
        let query = 'SELECT * FROM revisions WHERE ticker = ?';
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
            WHERE ticker LIKE ? OR company_name LIKE ? 
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

