import Database from 'better-sqlite3';
import path from 'path';

// DB is in the root of frontend usually, or explicitly set.
// On Vercel this is tricky, but on VPS/Local it's a file.
const dbPath = path.join(process.cwd(), 'investor_news.db');

let db: ReturnType<typeof Database>;

try {
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');
} catch (error) {
    console.error("Failed to connect to database at", dbPath, error);
    // Fallback or crash
    throw error;
}

export default db;
