
import sqlite3
import time
from database import get_db_connection
from fetch_dividend_history import fetch_dividend_history, save_history

def backfill_dividends():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get all tickers from companies table (Full Market)
    print("Fetching tickers list from companies (Full Market)...")
    tickers = [row['ticker'] for row in c.execute("SELECT ticker FROM companies ORDER BY ticker").fetchall()]
    if not tickers: 
        tickers = [row['ticker'] for row in c.execute("SELECT DISTINCT ticker FROM financial_stats").fetchall()]
    conn.close()
    
    print(f"Found {len(tickers)} tickers to check for dividend history.")
    
    for i, ticker in enumerate(tickers):
        print(f"[{i+1}/{len(tickers)}] Processing {ticker}...")
        
        # Check if we already have recent data?
        # Maybe skip if we have data updated today?
        # For now, force fetch to be sure.
        
        try:
            history = fetch_dividend_history(ticker)
            if history:
                save_history(ticker, history)
            else:
                print(f"  No dividend history found for {ticker}")
            
            time.sleep(1.0) # Be polite
            
        except Exception as e:
            print(f"  Error processing {ticker}: {e}")
            time.sleep(2)

if __name__ == "__main__":
    backfill_dividends()
