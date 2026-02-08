
import sqlite3
import time
from database import get_db_connection
from fetch_financial_stats import fetch_financial_stats, save_financial_stats

def backfill_financials():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get all tickers from companies table (Full Market)
    print("Fetching tickers list from companies (Full Market)...")
    tickers = [row['ticker'] for row in c.execute("SELECT ticker FROM companies ORDER BY ticker").fetchall()]
    # Fallback if companies empty?
    if not tickers:
        print("Warning: companies table empty. Fallback to revisions.")
        tickers = [row['ticker'] for row in c.execute("SELECT DISTINCT ticker FROM revisions").fetchall()]
    conn.close()
    
    print(f"Found {len(tickers)} tickers to check for financial stats.")
    
    for i, ticker in enumerate(tickers):
        print(f"[{i+1}/{len(tickers)}] Processing {ticker}...")
        
        try:
            # Check if exists
            conn = get_db_connection()
            chk = conn.execute("SELECT 1 FROM financial_stats WHERE ticker = ? LIMIT 1", (ticker,)).fetchone()
            conn.close()
            
            if chk:
                print(f"  [SKIP] Financial stats already exist.")
            else:
                stats = fetch_financial_stats(ticker)
                if stats:
                    save_financial_stats(stats)
                else:
                    print(f"  No financial stats found for {ticker}")
                time.sleep(1.0)
            
        except Exception as e:
            print(f"  Error processing {ticker}: {e}")
            time.sleep(1)

if __name__ == "__main__":
    backfill_financials()
