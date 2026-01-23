import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Migrating 'revisions' table...")
    
    # Create revisions table
    # Stores numerical data for forecast revisions
    c.execute("""
        CREATE TABLE IF NOT EXISTS revisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT NOT NULL,
            company_name TEXT,
            revision_date DATE NOT NULL,
            quarter TEXT,
            
            -- Previous Forecast
            prev_sales REAL,
            prev_op REAL,
            prev_net REAL,
            
            -- Revised Forecast
            rev_sales REAL,
            rev_op REAL,
            rev_net REAL,
            
            -- Analysis
            is_upward BOOLEAN DEFAULT 0,
            revision_rate_op REAL DEFAULT 0, -- (Rev - Prev) / Prev
            
            -- Market Reaction
            market_reaction_1d REAL,
            volume_ratio REAL,
            
            -- Meta
            source_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            -- Valid data check (sometimes null if parsing failed)
            UNIQUE(ticker, revision_date)
        )
    """)
    
    # Add index for speed
    c.execute("CREATE INDEX IF NOT EXISTS idx_revisions_ticker ON revisions (ticker)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_revisions_date ON revisions (revision_date)")
    
    conn.commit()
    conn.close()
    print("Migration complete: 'revisions' table created.")

if __name__ == "__main__":
    migrate()
