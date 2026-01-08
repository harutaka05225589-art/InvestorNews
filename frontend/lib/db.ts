import Database from 'better-sqlite3';
import path from 'path';

// In development, Next.js 'process.cwd()' is the project root (frontend)
// DB is in sibling 'backend' folder
const dbPath = path.resolve(process.cwd(), '../backend/investor_news.db');

let db: any;

try {
    db = new Database(dbPath, { fileMustExist: false });
} catch (error) {
    console.error('Failed to open database at', dbPath, error);
}

export function getInvestors() {
    if (!db) return [];
    // Get investors joined with daily_stats for ordering (if implemented)
    // For now just list them, we can sort by stats later
    const stmt = db.prepare(`
    SELECT i.*, 
    (SELECT COUNT(*) FROM news_items n WHERE n.investor_id = i.id) as news_count 
    FROM investors i
    ORDER BY news_count DESC
  `);
    return stmt.all();
}

export function getInvestorById(id: string) {
    if (!db) return null;
    const stmt = db.prepare('SELECT * FROM investors WHERE id = ?');
    return stmt.get(id);
}

export function getNewsByInvestor(id: string) {
    if (!db) return [];
    const stmt = db.prepare(`
    SELECT * FROM news_items 
    WHERE investor_id = ? 
    ORDER BY published_at DESC
  `);
    return stmt.all(id);
}

export default db;
