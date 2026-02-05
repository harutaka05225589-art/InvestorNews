import sqlite3
import os

DB_PATH = 'frontend/investor_news.db'

def check_schema():
    if not os.path.exists(DB_PATH):
        print("DB not found")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("--- portfolio_transactions Schema ---")
    try:
        info = c.execute("PRAGMA table_info(portfolio_transactions)").fetchall()
        for col in info:
            print(col)
    except Exception as e:
        print(f"Error: {e}")

    conn.close()

if __name__ == "__main__":
    check_schema()
