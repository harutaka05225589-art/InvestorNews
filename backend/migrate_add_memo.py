import sqlite3
import os

DB_NAME = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    print(f"Connecting to database: {DB_NAME}")
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    try:
        # Check if column exists
        c.execute("PRAGMA table_info(alerts)")
        columns = [row[1] for row in c.fetchall()]
        
        if 'memo' not in columns:
            print("Adding 'memo' column to alerts table...")
            c.execute("ALTER TABLE alerts ADD COLUMN memo TEXT DEFAULT ''")
            print("Column added successfully.")
        else:
            print("'memo' column already exists.")

        conn.commit()
    except Exception as e:
        print(f"Migration error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
