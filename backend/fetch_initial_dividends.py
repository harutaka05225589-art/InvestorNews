
import sqlite3
import os
import yfinance as yf
import time
from datetime import datetime

# DB Setup
db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
if not os.path.exists(db_path):
    db_path = 'investor_news.db'

print(f"Connecting to: {db_path}")
conn = sqlite3.connect(db_path)
c = conn.cursor()

def fetch_and_store_dividends():
    # 1. Get all unique tickers from ir_events (Master list)
    # If ir_events is empty, we might need another source, but assuming it has data
    try:
        c.execute("SELECT DISTINCT ticker FROM ir_events")
        tickers = [row[0] for row in c.fetchall()]
    except Exception as e:
        print(f"Error fetching tickers: {e}")
        return

    print(f"Found {len(tickers)} tickers to process.")
    
    # 2. Process in batches to avoid overwhelming (though yf is permissive)
    count = 0
    updated = 0
    
    for ticker in tickers:
        # Skip if not numeric (non-JP stock?)
        if not ticker.isdigit():
            continue

        yf_ticker = f"{ticker}.T"
        print(f"[{count+1}/{len(tickers)}] Fetching {yf_ticker}...")
        
        try:
            stock = yf.Ticker(yf_ticker)
            info = stock.info
            
            # Extract Dividend
            # dividendRate is annual dividend in currency
            # dividendYield is percentage
            div_rate = info.get('dividendRate')
            
            if div_rate is not None and div_rate > 0:
                print(f"  -> Dividend: {div_rate} JPY")
                
                # Insert as a 'baseline' revision
                # We use a special marking (e.g., quarter='Initial', title='Initial Data')
                # Check if we already have data for this ticker to avoid duplicates if run multiple times
                c.execute("SELECT id FROM revisions WHERE ticker = ? AND title = 'YahooFinance_Initial'", (ticker,))
                if c.fetchone():
                    print("  -> Skipped (Already exists)")
                else:
                    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    today_date = datetime.now().strftime('%Y-%m-%d')
                    
                    # Estimate Rights Month (Simple logic: Max div usually Mar/Sep)
                    # For accuracy, we'd need ex-div date, but let's default to null or try to parse 'exDividendDate'
                    rights_month = None
                    ex_div_timestamp = info.get('exDividendDate')
                    if ex_div_timestamp:
                        dt = datetime.fromtimestamp(ex_div_timestamp)
                        rights_month = dt.month
                    
                    c.execute("""
                        INSERT INTO revisions (
                            ticker, company_name, revision_date, title, 
                            dividend_forecast_annual, dividend_rights_month, 
                            ai_analyzed, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
                    """, (
                        ticker, 
                        info.get('longName', f"Company {ticker}"),
                        today_date,
                        'YahooFinance_Initial',
                        div_rate,
                        rights_month,
                        now
                    ))
                    conn.commit()
                    updated += 1
            else:
                print("  -> No dividend data.")
                
        except Exception as e:
            print(f"  -> Error: {e}")
        
        count += 1
        time.sleep(0.5) # Gentle rate limiting

    print(f"Finished. Updated {updated} stocks.")

try:
    fetch_and_store_dividends()
except KeyboardInterrupt:
    print("Stopped by user.")
finally:
    conn.close()
