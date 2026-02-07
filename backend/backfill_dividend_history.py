import sqlite3
import os
import time
import random
from database import get_db_connection
from fetch_dividend_history import fetch_dividend_history, save_history

def backfill():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get all tickers
    print("Fetching ticker list from ir_events...")
    # Using ir_events as a base for 'active' tickers. 
    # Alternatively revisions table.
    # Select distinct ticker from both just to be sure?
    # Let's use ir_events for now.
    tickers = [row[0] for row in c.execute("SELECT DISTINCT ticker FROM ir_events").fetchall()]
    
    # Also check revisions just in case
    rev_tickers = [row[0] for row in c.execute("SELECT DISTINCT ticker FROM revisions").fetchall()]
    
    all_tickers = sorted(list(set(tickers + rev_tickers)))
    total = len(all_tickers)
    
    print(f"Total tickers to check: {total}")
    
    # Check existing coverage
    existing = [row[0] for row in c.execute("SELECT DISTINCT ticker FROM dividend_history").fetchall()]
    existing_set = set(existing)
    print(f"Already have data for {len(existing_set)} tickers.")
    
    processed = 0
    updated = 0
    
    for ticker in all_tickers:
        # Skip if already exists? Or force update?
        # User asked "Did we get for all?". Implies filling gaps.
        # But maybe we want to refresh too?
        # Let's skip existing for now to speed up the 'missing' part.
        if ticker in existing_set:
            # print(f"Skipping {ticker} (exists)")
            continue
            
        print(f"[{processed+1}/{total}] Fetching for {ticker}...")
        
        try:
            history = fetch_dividend_history(ticker)
            if history:
                save_history(ticker, history)
                updated += 1
            else:
                print(f"  No history found for {ticker}.")
                
            # Sleep to respect server
            time.sleep(1.5 + random.random()) 
            
        except Exception as e:
            print(f"  Error processing {ticker}: {e}")
            
        processed += 1
        
        # Periodic Commit (save_history commits, but good to know)
        
    print(f"Backfill Complete. Updated {updated} tickers.")
    conn.close()

if __name__ == "__main__":
    backfill()
