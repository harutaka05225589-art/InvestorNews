import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def check():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Check Count
    c.execute("SELECT COUNT(*) FROM ir_events")
    count = c.fetchone()[0]
    print(f"Total rows in ir_events: {count}")
    
    # Check for REITs again with LIKE
    print("Checking for '投資法人' (repr check)...")
    c.execute("SELECT id, ticker, company_name FROM ir_events WHERE company_name LIKE '%投資法人%' LIMIT 10")
    rows = c.fetchall()
    
    print(f"Found {len(rows)} REIT candidates.")
    for r in rows:
        print(f"ID: {r[0]}, Ticker: {r[1]}, Name: {repr(r[2])}")

    conn.close()

if __name__ == "__main__":
    check()
