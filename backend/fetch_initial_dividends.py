
import sqlite3
import os
import yfinance as yf
import time
import random
from datetime import datetime

# DB Setup
db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
if not os.path.exists(db_path):
    db_path = 'investor_news.db'

print(f"Connecting to: {db_path}")
conn = sqlite3.connect(db_path)
c = conn.cursor()

def get_priority_tickers():
    try:
        # Check if table exists first
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='portfolio_transactions'")
        if not c.fetchone():
            return []
        
        c.execute("SELECT DISTINCT ticker FROM portfolio_transactions")
        return [row[0] for row in c.fetchall()]
    except:
        return []

def fetch_and_store_dividends():
    # 1. Get Priority Tickers (User's Portfolio)
    priority_tickers = get_priority_tickers()
    print(f"Priority Tickers (Portfolio): {priority_tickers}")

    # 2. Get All Tickers
    try:
        c.execute("SELECT DISTINCT ticker FROM ir_events")
        all_tickers = [row[0] for row in c.fetchall()]
    except Exception as e:
        print(f"Error fetching tickers: {e}")
        return

    # 3. Combine and Deduplicate (Priority first)
    # Use a dict to preserve order (Python 3.7+)
    ticker_map = {t: True for t in priority_tickers}
    for t in all_tickers:
        ticker_map[t] = True
    
    sorted_tickers = list(ticker_map.keys())
    total = len(sorted_tickers)
    print(f"Found {total} tickers to process.")
    
    count = 0
    updated = 0
    consecutive_errors = 0
    
    for ticker in sorted_tickers:
        # Determine priority
        is_priority = ticker in priority_tickers
        
        # Check existence
        c.execute("""
            SELECT id, dividend_payment_month 
            FROM revisions 
            WHERE ticker = ? AND title = 'YahooFinance_Initial'
        """, (ticker,))
        existing = c.fetchone()
        
        # Logic:
        # 1. If priority (portfolio), always update (or at least check if improved data available)
        # 2. If not priority and exists, skip
        if existing and not is_priority:
             # Just checking if we have dividend data generally
            c.execute("SELECT id FROM revisions WHERE ticker = ? AND dividend_forecast_annual IS NOT NULL", (ticker,))
            if c.fetchone():
                print(f"[{count+1}/{total}] Skipping {ticker} (Data exists)")
                count += 1
                continue
            
        if not ticker.isdigit():
            count += 1
            continue

        yf_ticker = f"{ticker}.T"
        print(f"[{count+1}/{total}] Fetching {yf_ticker}...")
        
        try:
            # Random delay
            time.sleep(2 + random.random() * 2) 
            
            stock = yf.Ticker(yf_ticker)
            info = stock.info
            
            consecutive_errors = 0
            
            div_rate = info.get('dividendRate')
            if div_rate is None: div_rate = 0
            
            print(f"  -> Dividend: {div_rate} JPY")
            
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            today_date = datetime.now().strftime('%Y-%m-%d')
            
            # --- Month Extraction Logic ---
            rights_month = None
            payment_month = None
            
            # 1. Rights Date (Ex-Dividend Date)
            ex_div_timestamp = info.get('exDividendDate')
            if ex_div_timestamp:
                dt = datetime.fromtimestamp(ex_div_timestamp)
                rights_month = dt.month
                
            # 2. Payment Date (dividendDate) - Try to get explicit date
            div_timestamp = info.get('dividendDate')
            if div_timestamp:
                dt_pay = datetime.fromtimestamp(div_timestamp)
                payment_month = dt_pay.month
            
            # 3. Fallback Estimation for Payment Month
            if payment_month is None and rights_month is not None:
                # Usually +3 months for JP stocks
                payment_month = rights_month + 3
                if payment_month > 12: payment_month -= 12
                print(f"  -> Estimated Payment: Month {payment_month} (Rights: {rights_month})")
            elif payment_month:
                print(f"  -> Found Payment: Month {payment_month}")

            # Upsert Logic
            if existing: # Update existing Initial entry
                c.execute("""
                    UPDATE revisions SET
                        company_name = ?,
                        dividend_forecast_annual = ?,
                        dividend_rights_month = ?,
                        dividend_payment_month = ?,
                        ai_analyzed = 1,
                        updated_at = ?
                    WHERE id = ?
                """, (
                    info.get('longName', f"Company {ticker}"),
                    div_rate,
                    rights_month,
                    payment_month,
                    now,
                    existing[0]
                ))
                print(f"  -> Updated existing entry.")
            else:
                c.execute("""
                    INSERT INTO revisions (
                        ticker, company_name, revision_date, title, 
                        dividend_forecast_annual, dividend_rights_month, dividend_payment_month,
                        ai_analyzed, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
                """, (
                    ticker, 
                    info.get('longName', f"Company {ticker}"),
                    today_date,
                    'YahooFinance_Initial',
                    div_rate,
                    rights_month,
                    payment_month,
                    now
                ))
            
            conn.commit()
            updated += 1
                
        except Exception as e:
            err_str = str(e)
            print(f"  -> Error: {err_str}")
            if "429" in err_str or "Too Many Requests" in err_str:
                consecutive_errors += 1
                sleep_time = 60 * consecutive_errors
                print(f"⚠️ RATE LIMIT HIT. Sleeping for {sleep_time} seconds...")
                time.sleep(sleep_time)
            elif "404" in err_str:
                print("  -> Ticker not found.")
            else:
                consecutive_errors += 1
                time.sleep(5)
        
        count += 1
        # Save verify
        if count % 10 == 0:
            conn.commit()

    print(f"Finished. Updated {updated} stocks.")

try:
    fetch_and_store_dividends()
except KeyboardInterrupt:
    print("Stopped by user.")
finally:
    conn.close()
