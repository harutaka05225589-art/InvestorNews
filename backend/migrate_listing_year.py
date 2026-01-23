import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Checking 'ir_events' table columns...")
    c.execute("PRAGMA table_info(ir_events)")
    columns = [r[1] for r in c.fetchall()]
    
    if 'listing_year' not in columns:
        print("Adding 'listing_year' column...")
        c.execute("ALTER TABLE ir_events ADD COLUMN listing_year INTEGER")
    
    conn.commit()
    conn.close()
    print("Migration complete: 'listing_year' added.")

if __name__ == "__main__":
    migrate()
