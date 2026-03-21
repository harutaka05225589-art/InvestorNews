import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Adding 'comment' column to 'user_votes' table...")
    try:
        c.execute("ALTER TABLE user_votes ADD COLUMN comment TEXT;")
        print("Successfully added 'comment' column.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("'comment' column already exists.")
        else:
            print(f"Error: {e}")
            
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
