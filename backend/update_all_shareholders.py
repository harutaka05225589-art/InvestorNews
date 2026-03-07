import time
import datetime
import sqlite3
from database import get_db_connection
from fetch_shareholders import fetch_shareholders, save_shareholders

def run_weekly_shareholder_update():
    """
    Fetches all active tickers from the database and updates their shareholder information
    by scraping Kabutan. Designed to run weekly to keep ownership ratios fresh.
    """
    print(f"\n--- Starting Weekly Shareholder Update: {datetime.datetime.now()} ---")
    
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get all unique tickers from both companies and stock_profiles just to be safe
    c.execute('''
        SELECT DISTINCT ticker FROM (
            SELECT code as ticker FROM companies
            UNION
            SELECT ticker FROM stock_profiles
        ) WHERE ticker IS NOT NULL
        ORDER BY ticker
    ''')
    rows = c.fetchall()
    conn.close()
    
    tickers = [r['ticker'] for r in rows if r['ticker']]
    total = len(tickers)
    
    print(f"Found {total} unique tickers to update.")
    
    updated_count = 0
    error_count = 0
    
    for i, ticker in enumerate(tickers, 1):
        try:
            print(f"[{i}/{total}] Updating shareholders for {ticker}...")
            # fetch_shareholders is imported from fetch_shareholders.py 
            shareholders = fetch_shareholders(ticker)
            
            if shareholders:
                # save_shareholders will insert/replace in the stock_shareholders table
                save_shareholders(ticker, shareholders)
                updated_count += 1
            else:
                print(f"  No shareholder data found for {ticker}.")
                
            # Rate limiting to prevent hammering Kabutan
            time.sleep(1.5)
            
        except Exception as e:
            print(f"  Error updating {ticker}: {e}")
            error_count += 1
            time.sleep(2.0)
            
    print(f"\n--- Weekly Shareholder Update Complete ---")
    print(f"Successfully updated: {updated_count}/{total}")
    print(f"Errors encountered: {error_count}")

if __name__ == "__main__":
    run_weekly_shareholder_update()
