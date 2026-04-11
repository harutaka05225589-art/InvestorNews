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
    
    # 2. Fetch Dividends ONLY for these alphanumerics
    print("\n--- Triggering Dividend Fetch for Alphanumeric ---")
    import yfinance as yf
    from datetime import datetime
    
    for row in alphanumerics:
        ticker = row['ticker']
        name = row['name']
        yf_ticker = f"{ticker}.T"
        print(f"  Fetching Dividend: {yf_ticker}")
        try:
            stock = yf.Ticker(yf_ticker)
            info = stock.info
            div_rate = info.get('dividendRate', 0)
            
            ex_div = info.get('exDividendDate')
            rights_month = datetime.fromtimestamp(ex_div).month if ex_div else None
            
            div_pay = info.get('dividendDate')
            payment_month = datetime.fromtimestamp(div_pay).month if div_pay else (rights_month + 3 if rights_month else None)
            if payment_month and payment_month > 12: payment_month -= 12
                
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            c.execute("""
                INSERT OR REPLACE INTO revisions (
                    ticker, company_name, revision_date, title, 
                    dividend_forecast_annual, dividend_rights_month, dividend_payment_month,
                    ai_analyzed, created_at, updated_at
                ) VALUES (
                    ?, ?, ?, 'YahooFinance_Initial', ?, ?, ?, 1, ?, ?
                )
                ON CONFLICT(id) DO UPDATE SET 
                    dividend_forecast_annual=excluded.dividend_forecast_annual,
                    dividend_rights_month=excluded.dividend_rights_month,
                    dividend_payment_month=excluded.dividend_payment_month,
                    updated_at=excluded.updated_at
            """, (ticker, name, datetime.now().strftime('%Y-%m-%d'), div_rate, rights_month, payment_month, now, now))
            conn.commit()
            print(f"  -> Saved Dividend: {div_rate} JPY")
            time.sleep(2)
            
        except Exception as e:
            print(f"  [Dividend Fetch Error]: {ticker} - {e}")
            time.sleep(5)
            
    conn.close()
