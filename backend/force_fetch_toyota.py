
import sqlite3
import os
import sys

# Ensure we can import backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fetch_financial_stats import fetch_financial_stats, save_financial_stats
from database import get_db_connection

def force_update_toyota():
    ticker = "7203"
    print(f"--- Force Updating Financials for {ticker} ---")
    
    # 1. Fetch
    print("Fetching from Kabutan...")
    data = fetch_financial_stats(ticker)
    if not data:
        print("Error: No data fetched!")
        return
        
    print(f"Fetched {len(data)} records.")
    
    # 2. Save
    print("Saving to DB...")
    save_financial_stats(data)
    
    # 3. Verify
    print("Verifying DB content...")
    conn = get_db_connection()
    c = conn.cursor()
    
    # Check path
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')
    print(f"Target DB Path: {os.path.abspath(db_path)}")
    
    rows = c.execute("SELECT period_type, period_end, sales FROM financial_stats WHERE ticker = ? ORDER BY period_end DESC", (ticker,)).fetchall()
    
    print(f"DB now has {len(rows)} records for {ticker}:")
    for r in rows:
        print(f"  {r['period_type']} {r['period_end']} : Sales={r['sales']}")
        
    conn.close()

if __name__ == "__main__":
    force_update_toyota()
