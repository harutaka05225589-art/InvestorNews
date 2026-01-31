
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path logic same as app
const dbPath = path.join(process.cwd(), 'frontend', 'investor_news.db');
console.log("Checking DB at:", dbPath);

if (!fs.existsSync(dbPath)) {
    console.error("File does not exist!");
    process.exit(1);
}

try {
    const db = new Database(dbPath, { verbose: console.log });

    // Check tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("Tables:", tables.map(t => t.name));

    // Check portfolio_transactions
    const row = db.prepare("SELECT count(*) as count FROM portfolio_transactions").get();
    console.log("Portfolio Transactions Count:", row.count);

    // Try a dummy insert/rollback
    const stmt = db.prepare("INSERT INTO portfolio_transactions (user_id, ticker, shares, price, transaction_date) VALUES (1, '9999', 100, 100, '2024-01-01')");
    const info = stmt.run();
    console.log("Insert Test Success. ID:", info.lastInsertRowid);

    // Cleanup
    db.prepare("DELETE FROM portfolio_transactions WHERE id = ?").run(info.lastInsertRowid);
    console.log("Cleanup Success.");

} catch (e) {
    console.error("FAIL:", e);
}
