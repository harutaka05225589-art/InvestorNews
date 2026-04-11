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
            
        # 3. Fetch Financial Stats from Kabutan (Temporary Initial Data)
        print("  Fetching financial stats from Kabutan...")
        try:
            import fetch_kabutan_financials
            fin_data = fetch_kabutan_financials.fetch_financials(ticker)
            if fin_data:
                fetch_kabutan_financials.save_financials(fin_data)
                print(f"  -> Saved {len(fin_data)} financial records.")
            else:
                print("  -> No financial data found.")
            time.sleep(1.5) # Kabutan rate limit
        except Exception as e:
            print(f"  [Financial Fetch Error]: {e}")
            
    # Do not close connection here since we use it below
    
    
    # 2. Fetch Dividends ONLY for these alphanumerics (Fallback to Kabutan due to Yahoo block)
    print("\n--- Triggering Dividend Fetch for Alphanumeric (via Kabutan) ---")
    import requests
    from bs4 import BeautifulSoup
    from datetime import datetime
    
    for row in alphanumerics:
        ticker = row['ticker']
        name = row['name']
        print(f"  Fetching Dividend: {ticker}")
        try:
            url = f"https://kabutan.jp/stock/finance?code={ticker}"
            res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}, timeout=10)
            soup = BeautifulSoup(res.content, 'html.parser')
            
            div_rate = 0.0
            rights_month = None
            
            for t in soup.find_all('table'):
                header_text = t.find('tr').text if t.find('tr') else ""
                if '決算期' in header_text and '1株配' in header_text:
                    rows = t.find_all('tr')
                    for r in rows[-3:]: # Check the last few rows to extract forecast or latest actua
                        cells = r.find_all(['th', 'td'])
                        if len(cells) >= 7:
                            period_str = cells[0].text.strip()
                            div_str = cells[6].text.strip()
                            
                            try:
                                div_val = float(re.sub(r'[^0-9.]', '', div_str))
                                if div_val >= 0: 
                                    div_rate = div_val
                            except:
                                pass
                                
                            match = re.search(r'\.([0-9]{2})', period_str)
                            if match:
                                rights_month = int(match.group(1))
                    break
            
            payment_month = (rights_month + 3) if rights_month else None
            if payment_month and payment_month > 12: payment_month -= 12
                
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            c.execute("""
                INSERT OR REPLACE INTO revisions (
                    ticker, company_name, revision_date, title, 
                    dividend_forecast_annual, dividend_rights_month, dividend_payment_month,
                    ai_analyzed, created_at, updated_at
                ) VALUES (
                    ?, ?, ?, 'Kabutan_Initial', ?, ?, ?, 1, ?, ?
                )
                ON CONFLICT(id) DO UPDATE SET 
                    dividend_forecast_annual=excluded.dividend_forecast_annual,
                    dividend_rights_month=excluded.dividend_rights_month,
                    dividend_payment_month=excluded.dividend_payment_month,
                    updated_at=excluded.updated_at
            """, (ticker, name, datetime.now().strftime('%Y-%m-%d'), div_rate, rights_month, payment_month, now, now))
            conn.commit()
            print(f"  -> Saved Dividend: {div_rate} JPY (Rights: {rights_month})")
            time.sleep(1.5)
            
        except Exception as e:
            print(f"  [Dividend Fetch Error]: {ticker} - {e}")
            time.sleep(2)
            
    conn.close()

if __name__ == "__main__":
    backfill()
