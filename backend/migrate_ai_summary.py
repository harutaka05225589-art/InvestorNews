import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Checking 'news_items' table columns...")
    c.execute("PRAGMA table_info(news_items)")
    columns = [r[1] for r in c.fetchall()]
    
    if 'ai_summary' not in columns:
        print("Adding 'ai_summary' column...")
        c.execute("ALTER TABLE news_items ADD COLUMN ai_summary TEXT")
    
    if 'importance_score' not in columns:
        print("Adding 'importance_score' column...")
        c.execute("ALTER TABLE news_items ADD COLUMN importance_score INTEGER DEFAULT 0")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
