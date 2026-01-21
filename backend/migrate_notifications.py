import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Checking 'users' table columns...")
    c.execute("PRAGMA table_info(users)")
    columns = [r[1] for r in c.fetchall()]
    
    # Add notification_settings columns
    if 'email_notifications' not in columns:
        print("Adding 'email_notifications' column...")
        c.execute("ALTER TABLE users ADD COLUMN email_notifications INTEGER DEFAULT 0") # 0: Off, 1: On
    
    if 'email_verified' not in columns:
        print("Adding 'email_verified' column...")
        c.execute("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
