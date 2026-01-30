import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Migrating 'revisions' table to add 'forecast_data'...")
    
    try:
        # Add column for JSON data
        c.execute("ALTER TABLE revisions ADD COLUMN forecast_data TEXT")
        print("Column 'forecast_data' added.")
    except sqlite3.OperationalError as e:
        print(f"Column might already exist: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
