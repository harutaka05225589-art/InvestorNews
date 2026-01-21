import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def check_market():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Checking market column distribution...")
    try:
        c.execute("SELECT market, COUNT(*) FROM ir_events GROUP BY market")
        rows = c.fetchall()
        for r in rows:
            print(f"Market '{r[0]}': {r[1]} records")
            
        print("\nNull market sample:")
        c.execute("SELECT ticker, company_name FROM ir_events WHERE market IS NULL LIMIT 5")
        nulls = c.fetchall()
        for n in nulls:
            print(f"- {n[0]} {n[1]}")
            
    except Exception as e:
        print(f"Error: {e}")

    conn.close()

if __name__ == "__main__":
    check_market()
