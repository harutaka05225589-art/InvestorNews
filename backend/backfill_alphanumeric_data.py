import sqlite3
import re
import time
import os
import sys

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db_connection
from fetch_company_profile import get_or_create_profile

def backfill():
    print("--- Starting Backfill for Alphanumeric Tickers ---")
    conn = get_db_connection()
    c = conn.cursor()
    
    # Select all alphanumeric tickers
    c.execute("""
        SELECT ticker, name FROM companies 
        WHERE ticker GLOB '*[A-Za-z]*'
    """)
    alphanumerics = c.fetchall()
    
    print(f"Found {len(alphanumerics)} alphanumeric tickers to process.")
    
    for row in alphanumerics:
        ticker = row['ticker']
        name = row['name']
        
        print(f"\nProcessing [{ticker}] {name}...")
        
        # 1. Fetch AI Profile
        try:
            get_or_create_profile(ticker, name)
            time.sleep(1) # Rate limit Gemini slightly
        except Exception as e:
            print(f"  [Profile Error]: {e}")
            
        # 2. Fetch Shareholders from Kabutan (Temporary Initial Data)
        print("  Fetching shareholders from Kabutan...")
        try:
            import fetch_shareholders
            sh_data = fetch_shareholders.fetch_shareholders(ticker)
            if sh_data:
                fetch_shareholders.save_shareholders(sh_data)
                print(f"  -> Saved {len(sh_data)} shareholders.")
            else:
                print("  -> No shareholder data found.")
            time.sleep(1.5) # Kabutan rate limit
        except Exception as e:
            print(f"  [Shareholder Fetch Error]: {e}")
            
            
    conn.close()
    
    # 2. Fetch Dividends using the updated initial dividends script
    print("\n--- Triggering Dividend Fetch for Alphanumeric ---")
    import fetch_initial_dividends
    try:
        fetch_initial_dividends.fetch_and_store_dividends()
    except Exception as e:
        print(f"  [Dividend Fetch Error]: {e}")
        
    print("\n--- Backfill Complete ---")
    print("Note: Shareholder data (投資家情報) is fetched daily via EDINET when reports are published.")

if __name__ == "__main__":
    backfill()
