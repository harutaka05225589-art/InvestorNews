import sqlite3
from database import get_db_connection

def migrate():
    print("Migrating: Adding dividend_history table and tweeted_at column...")
    conn = get_db_connection()
    c = conn.cursor()

    # 1. Add dividend_history table
    c.execute('''
        CREATE TABLE IF NOT EXISTS dividend_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT NOT NULL,
            period TEXT NOT NULL, -- e.g. "2020.3", "2021.3"
            dividend_amount REAL,
            is_forecast BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(ticker, period)
        )
    ''')
    print("  -> Created dividend_history table.")

    # 2. Add tweeted_at to revisions
    try:
        c.execute("ALTER TABLE revisions ADD COLUMN tweeted_at TIMESTAMP")
        print("  -> Added tweeted_at column to revisions.")
    except sqlite3.OperationalError:
        print("  -> tweeted_at column already exists.")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
