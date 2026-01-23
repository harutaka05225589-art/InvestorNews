import sqlite3
import yfinance as yf
import pandas as pd
import os
import time
import datetime
from database import get_db_connection

def fetch_listing_years():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get tickers with missing listing_year
    c.execute("SELECT DISTINCT ticker FROM ir_events WHERE listing_year IS NULL")
    tickers = [r[0] for r in c.fetchall()]
    
    print(f"Found {len(tickers)} tickers to check for listing year.")
    
    batch_size = 20
    
    for i in range(0, len(tickers), batch_size):
        batch = tickers[i:i+batch_size]
        print(f"Processing batch {i}-{i+len(batch)}...")
        
        for ticker in batch:
            try:
                # Append .T for yfinance
                yticker = ticker + ".T"
                stock = yf.Ticker(yticker)
                
                # Fetch metadata
                # Note: .info can be slow and rate-limited.
                # 'firstTradeDateEpochUtc' is standard.
                year = None
                
                # Sometimes yfinance fails silently, need robust check
                try:
                     # Accessing .info triggers the fetch
                    info = stock.info
                    ts = info.get('firstTradeDateEpochUtc')
                    if ts:
                        dt = datetime.datetime.fromtimestamp(ts)
                        year = dt.year
                    else:
                        # Fallback: some data doesn't have first trade date
                        pass
                except Exception as e:
                    # print(f"  Failed info fetch for {ticker}: {e}")
                    pass
                
                if year:
                    print(f"  {ticker}: Listed {year}")
                    c.execute("UPDATE ir_events SET listing_year = ? WHERE ticker = ?", (year, ticker))
                else:
                    # Mark as 0 or something to avoid refetching? 
                    # For now leave NULL to retry later or assume old.
                    pass
                
            except Exception as e:
                print(f"  Error {ticker}: {e}")
            
            # Be nice to API
            time.sleep(0.5)
            
        conn.commit()
        print("  Batch committed.")
        
    conn.close()
    print("Listing year update complete.")

if __name__ == "__main__":
    fetch_listing_years()
