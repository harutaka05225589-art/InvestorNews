import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'frontend/investor_news.db')
if not os.path.exists(DB_PATH):
    # Try alternate path if running from backend dir
    DB_PATH = os.path.join(os.path.dirname(__file__), '../frontend/investor_news.db')

print(f"Checking DB at: {DB_PATH}")

try:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 1. Check Specific Tickers mentioned
    target_tickers = ['9509', '3350', '2491', '5341', '9501', '3577']
    print("\n--- Target Ticker Status ---")
    rows = c.execute(f"SELECT id, ticker, company_name, ai_analyzed, is_upward, revision_rate_op, ai_summary FROM revisions WHERE ticker IN ({','.join(repr(t) for t in target_tickers)}) ORDER BY revision_date DESC").fetchall()
    
    for r in rows:
        print(f"Ticker: {r[1]} ({r[2]}) | Analyzed: {r[3]} | Upward: {r[4]} | Rate: {r[5]}% | Summary: {r[6]}")

    conn.close()

except Exception as e:
    print(f"Error: {e}")
