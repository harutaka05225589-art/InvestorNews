"""
Migration: Create admin_watchlist table for stock price alerts (admin-only).
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS admin_watchlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ticker TEXT UNIQUE NOT NULL,
            price_above REAL,
            price_below REAL,
            drop_threshold REAL DEFAULT -20,
            per_limit REAL DEFAULT 15,
            is_active INTEGER DEFAULT 1,
            last_price REAL,
            high_52w REAL,
            drop_pct REAL,
            current_per REAL,
            market_cap_oku REAL,
            buy_signal TEXT,
            signal_reasons TEXT,
            last_checked_at TIMESTAMP,
            last_alerted_at TIMESTAMP,
            last_alert_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
    print("✅ admin_watchlist table created successfully.")

if __name__ == '__main__':
    migrate()
