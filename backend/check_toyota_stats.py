
import sqlite3
import os

def check_toyota_stats():
    db_path = os.path.join(os.getcwd(), 'investor_news.db')
    if not os.path.exists(db_path):
        db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
        
    print(f"Checking DB: {db_path}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    ticker = '7203'
    print(f"Checking Financial Stats for {ticker}...")
    
    # Check count and years
    rows = c.execute("SELECT period_type, period_end, sales, operating_profit FROM financial_stats WHERE ticker = ? ORDER BY period_end DESC", (ticker,)).fetchall()
    
    if not rows:
        print("No data found.")
    else:
        print(f"Found {len(rows)} records.")
        for r in rows:
            print(r)

    conn.close()

if __name__ == "__main__":
    check_toyota_stats()
