from fetch_financial_stats import fetch_financial_stats, save_financial_stats
import sqlite3
from database import get_db_connection

def force_update():
    ticker = "1726"
    print(f"Force updating {ticker}...")
    data = fetch_financial_stats(ticker)
    print(f"Fetched {len(data)} records.")
    for d in data:
        print(f"  {d['period_type']} {d['period_end']}: {d['net_profit']}")
    
    save_financial_stats(data)
    
    # Check DB
    conn = get_db_connection()
    rows = list(conn.execute(f"SELECT period_type, period_end, net_profit FROM financial_stats WHERE ticker='{ticker}'"))
    print("\nDB Check:")
    for r in rows:
        print(f"  {r[0]} {r[1]}: {r[2]}")
    conn.close()

if __name__ == "__main__":
    force_update()
