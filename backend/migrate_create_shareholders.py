import sqlite3
import os

# Database Path
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'investor_news.db')

def migrate():
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Create stock_shareholders table
    print("Creating stock_shareholders table...")
    c.execute('''
    CREATE TABLE IF NOT EXISTS stock_shareholders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL,
        entry_date DATE NOT NULL, -- The date this data was fetched/valid for
        
        shareholder_name TEXT NOT NULL,
        share_count TEXT,          -- e.g. "2,761,050,700" or just string. Keeping as text to preserve format if needed. 
        share_ratio REAL,          -- e.g. 17.48 (%)
        rank INTEGER,              -- 1, 2, 3...
        
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(ticker, entry_date, shareholder_name)
    )
    ''')
    
    # Create indexes
    c.execute('CREATE INDEX IF NOT EXISTS idx_shareholders_ticker ON stock_shareholders(ticker)')
    
    conn.commit()
    conn.close()
    print("Migration complete: stock_shareholders table created.")

if __name__ == "__main__":
    migrate()
