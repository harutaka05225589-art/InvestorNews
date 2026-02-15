import sqlite3
import os
from database import get_db_connection

def check_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Check total count
    count = c.execute("SELECT count(*) FROM financial_stats").fetchone()[0]
    print(f"Total rows in financial_stats: {count}")
    
    # Check specific tickers from previous run
    # 6776 天昇電気工業
    # 6748 星和電機
    tickers = ["6776", "6748"]
    
    for t in tickers:
        rows = c.execute("SELECT count(*) FROM financial_stats WHERE ticker = ?", (t,)).fetchone()[0]
        print(f"Ticker {t}: {rows} rows")

    # Check the ones currently running
    # 4556
    rows_curr = c.execute("SELECT count(*) FROM financial_stats WHERE ticker = '4556'").fetchone()[0]
    print(f"Ticker 4556: {rows_curr} rows")

    conn.close()

if __name__ == "__main__":
    check_db()
