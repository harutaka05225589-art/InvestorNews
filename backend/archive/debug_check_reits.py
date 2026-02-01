import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def check_reits():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Checking for potential REIT names...")
    # Search for anything with 投資 or 法人
    c.execute("SELECT DISTINCT company_name FROM ir_events WHERE company_name LIKE '%投資%' OR company_name LIKE '%法人%' LIMIT 50")
    rows = c.fetchall()
    
    if not rows:
        print("No suspicious names found with '投資' or '法人'.")
    else:
        print(f"Found {len(rows)} potential REIT names:")
        for r in rows:
            print(f"- {r[0]}")

    conn.close()

if __name__ == "__main__":
    check_reits()
