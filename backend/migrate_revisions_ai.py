import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Checking 'revisions' table columns...")
    c.execute("PRAGMA table_info(revisions)")
    columns = [r[1] for r in c.fetchall()]
    
    if 'ai_summary' not in columns:
        print("Adding 'ai_summary' column...")
        c.execute("ALTER TABLE revisions ADD COLUMN ai_summary TEXT")
        
    if 'ai_analyzed' not in columns:
        print("Adding 'ai_analyzed' column...")
        c.execute("ALTER TABLE revisions ADD COLUMN ai_analyzed BOOLEAN DEFAULT 0")

    conn.commit()
    conn.close()
    print("Migration complete: 'revisions' table updated.")

if __name__ == "__main__":
    migrate()
