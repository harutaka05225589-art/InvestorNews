import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '../frontend/investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Creating 'portfolio_transactions' table...")
    
    # Create table for individual transactions
    # Not linked to alerts (watchlist) as requested ("separate")
    c.execute("""
        CREATE TABLE IF NOT EXISTS portfolio_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ticker TEXT NOT NULL,
            shares REAL NOT NULL,        -- Allows fractional shares if needed, but usually integer
            price REAL NOT NULL,         -- Acquisition price per share
            transaction_date TEXT,       -- ISO8601 YYYY-MM-DD. Nullable (if unknown)
            account_type TEXT DEFAULT 'general', -- 'nisa' or 'general'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    
    # Create index for fast lookup by user
    c.execute("CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_transactions(user_id)")
    
    conn.commit()
    conn.close()
    print("Migration 'portfolio_transactions' completed.")

if __name__ == "__main__":
    migrate()
