
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log("CWD:", process.cwd());

// Should find db in current dir (frontend)
const dbPath = path.join(process.cwd(), 'investor_news.db');
console.log("Checking DB at:", dbPath);

if (!fs.existsSync(dbPath)) {
    console.error("File does not exist!");
    // Check if it exists in frontend subdir (if we are in root)
    const altPath = path.join(process.cwd(), 'frontend', 'investor_news.db');
    if (fs.existsSync(altPath)) {
        console.log("Found at alternate path:", altPath);
    } else {
        process.exit(1);
    }
}

try {
    const db = new Database(dbPath, { verbose: console.log });

    // Check WAL mode
    console.log("Journal Mode:", db.pragma('journal_mode', { simple: true }));

    // Check tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("Tables found:", tables.map(t => t.name));

    // Check portfolio_transactions explicitly
    const hasTable = tables.find(t => t.name === 'portfolio_transactions');
    if (hasTable) {
        console.log("✅ Table 'portfolio_transactions' EXISTS.");
        const count = db.prepare("SELECT count(*) as count FROM portfolio_transactions").get();
        console.log("   Row count:", count.count);
    } else {
        console.error("❌ Table 'portfolio_transactions' MISSING.");
    }

    db.close();

} catch (e) {
    console.error("FAIL:", e);
}
