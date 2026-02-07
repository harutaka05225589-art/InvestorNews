import sqlite3
import os

# Database Path
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'investor_news.db')

def migrate():
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Create financial_stats table
    print("Creating financial_stats table...")
    c.execute('''
    CREATE TABLE IF NOT EXISTS financial_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL,
        period_type TEXT NOT NULL, -- 'annual' or 'quarter'
        period_end TEXT NOT NULL,  -- '2024-03' or '2023-12' (standardized YYYY-MM)
        
        sales REAL,
        operating_profit REAL,
        ordinary_profit REAL,
        net_profit REAL,
        eps REAL,
        
        is_forecast BOOLEAN DEFAULT 0,
        source TEXT DEFAULT 'kabutan', -- 'kabutan' or 'tdnet'
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(ticker, period_type, period_end)
    )
    ''')
    
    # Create indexes for speed
    c.execute('CREATE INDEX IF NOT EXISTS idx_finance_ticker ON financial_stats(ticker)')
    
    conn.commit()
    conn.close()
    print("Migration complete: financial_stats table created.")

if __name__ == "__main__":
    migrate()
