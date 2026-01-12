import sqlite3
import os

# Database path (Relative to backend/)
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'investor_news.db')

def migrate():
    print(f"Migrating database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Create Users Table
    print("Creating 'users' table...")
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            nickname TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Create Alerts Table
    print("Creating 'alerts' table...")
    c.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ticker TEXT NOT NULL,
            target_per REAL NOT NULL,
            condition TEXT NOT NULL, -- 'ABOVE' or 'BELOW'
            is_active INTEGER DEFAULT 1,
            last_triggered_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
