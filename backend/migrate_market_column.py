import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Checking for 'market' column in ir_events...")
    c.execute("PRAGMA table_info(ir_events)")
    columns = [r[1] for r in c.fetchall()]
    
    if 'market' not in columns:
        print("Adding 'market' column...")
        c.execute("ALTER TABLE ir_events ADD COLUMN market TEXT")
        conn.commit()
        print("Column added.")
    else:
        print("'market' column already exists.")

    conn.close()

if __name__ == "__main__":
    migrate()
