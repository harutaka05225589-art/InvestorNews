import sqlite3
import os
import sys

# Force UTF-8 for output
sys.stdout.reconfigure(encoding='utf-8')

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def list_recent():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Listing last 20 events...")
    c.execute("SELECT ticker, company_name FROM ir_events ORDER BY id DESC LIMIT 20")
    rows = c.fetchall()
    
    for r in rows:
        print(f"{r[0]}: {r[1]}")

    conn.close()

if __name__ == "__main__":
    list_recent()
