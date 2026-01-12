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
            id, name, aliases, style_description, 
            twitter_url, image_url, profile 
        FROM investors
    `);
    return stmt.all() as Investor[];
}

export function getInvestorById(id: string | number): Investor | undefined {
    const stmt = db.prepare('SELECT * FROM investors WHERE id = ?');
    return stmt.get(id) as Investor | undefined;
}

export function getNewsByInvestor(investorId: string | number): NewsItem[] {
    const stmt = db.prepare(`
        SELECT * FROM news 
        WHERE investor_id = ? 
        ORDER BY published_at DESC 
        LIMIT 50
    `);
    return stmt.all(investorId) as NewsItem[];
}
