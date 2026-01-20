// DB Helper v3
import Database from 'better-sqlite3';
import path from 'path';
import { Investor, NewsItem } from './types';

// DB is in the root of frontend usually, or explicitly set.
const dbPath = path.join(process.cwd(), 'investor_news.db');

let db: ReturnType<typeof Database>;

try {
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');
} catch (error) {
    console.error("Failed to connect to database at (v4)", dbPath, error);
    throw error;
}

export default db;

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
