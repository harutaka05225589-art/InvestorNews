import sqlite3
import yfinance as yf
import pandas as pd
import os
import time
import datetime
import requests
import re
from bs4 import BeautifulSoup
from database import get_db_connection

def fetch_listing_years():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Determine mode
    import sys
    force_full = "--full" in sys.argv
    
    if force_full:
        print("Mode: FULL UPDATE (Checking all stocks)")
        c.execute("SELECT DISTINCT ticker FROM ir_events")
    else:
        print("Mode: INCREMENTAL (Checking only missing listing years)")
        c.execute("SELECT DISTINCT ticker FROM ir_events WHERE listing_year IS NULL")
        
    tickers = [row[0] for row in c.fetchall()]
    print(f"Found {len(tickers)} tickers to check.")
    
    batch_size = 20
    for i in range(0, len(tickers), batch_size):
        batch = tickers[i:i+batch_size]
        print(f"Processing batch {i}-{i+len(batch)}...")
        
        for ticker in batch:
            try:
                # Yahoo Finance JP Scraping.
                # URL: https://finance.yahoo.co.jp/quote/{ticker}.T/profile
                url = f"https://finance.yahoo.co.jp/quote/{ticker}.T/profile"
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                
                year = None
                try:
                    res = requests.get(url, headers=headers, timeout=5)
                    if res.status_code == 200:
                        soup = BeautifulSoup(res.content, 'html.parser')
                        # Look for "上場年月日"
                        target_th = soup.find('th', string=re.compile("上場年月日"))
                        if target_th:
                            td = target_th.find_next_sibling('td')
                            if td:
                                text = td.get_text().strip()
                                # Parse "1949年5月16日" -> 1949
                                m = re.search(r'(\d{4})年', text)
                                if m:
                                    year = int(m.group(1))
                except Exception as ex:
                    print(f"  Scrape failed {ticker}: {ex}")

                if year:
                    print(f"  {ticker}: Listed {year}")
                    c.execute("UPDATE ir_events SET listing_year = ? WHERE ticker = ?", (year, ticker))
                else:
                    # Keep NULL if not found, to check again later (or we could mark as 0)
                    print(f"  {ticker}: Year not found")
                
            except Exception as e:
                print(f"  Error {ticker}: {e}")
            
            # Be nice to API
            time.sleep(1.0) 
            
        conn.commit()
        print("  Batch committed.")

    conn.close()
    print("Listing year update complete.")

if __name__ == "__main__":
    fetch_listing_years()
