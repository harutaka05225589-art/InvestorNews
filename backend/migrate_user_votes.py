import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Creating 'user_votes' table...")
    c.execute("""
        CREATE TABLE IF NOT EXISTS user_votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            ticker TEXT NOT NULL,
            vote_type TEXT NOT NULL, -- 'bull' or 'bear'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, ticker)
        )
    """)
    
    # Add indexes for fast aggregation
    c.execute("CREATE INDEX IF NOT EXISTS idx_user_votes_ticker ON user_votes (ticker)")
    
    conn.commit()
    conn.close()
    print("Successfully created 'user_votes' table.")

if __name__ == "__main__":
    migrate()
