import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Adding 'ai_prospects' column to 'revisions' table...")
    try:
        c.execute("ALTER TABLE revisions ADD COLUMN ai_prospects TEXT")
        print("Successfully added 'ai_prospects' column.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("'ai_prospects' column already exists.")
        else:
            print(f"Error: {e}")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
