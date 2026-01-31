
import requests
from bs4 import BeautifulSoup
import sqlite3
import os
import time
import random
import re
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
        c.execute("SELECT DISTINCT ticker FROM portfolio_transactions")
        return [row[0] for row in c.fetchall()]
    except:
        return []

def get_all_tickers():
    c.execute("SELECT DISTINCT ticker FROM ir_events")
    return [row[0] for row in c.fetchall()]

def fetch_kabutan_dividend(ticker):
    # Use the Finance (Kessan) page for more reliable table data
    url = f"https://kabutan.jp/stock/finance?code={ticker}&mode=k"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
    }
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            print(f"  Failed to fetch: {res.status_code}")
            return None

        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 1. Company Name
        company_name = None
        name_tag = soup.select_one('div.si_i1_1 h2') or soup.select_one('h2')
        if name_tag:
            # "2975　スターマイカ" -> extract name part if desired, or keep full
            # Usually we want just the name part but for now full string is okay or split
            full_text = name_tag.text.strip()
            # Try to split by space/tab
            parts = full_text.split(None, 1)
            if len(parts) > 1:
                company_name = parts[1]
            else:
                company_name = full_text

        # 2. Extract Data from Key Table
        div_amount = 0.0
        settlement_month = None
        
        # Find the table containing "修正1株配" (Revised Dividend per Share)
        # We look for a table header row properly
        target_table = None
        div_col_idx = -1
        period_col_idx = 0 # Usually 0
        
        tables = soup.find_all('table')
        for tbl in tables:
            # Check headers
            headers_list = [th.get_text(strip=True) for th in tbl.find_all('th')]
            # We are looking for a row like ['決算期', ..., '修正1株配', ...]
            # Note: headers might be split across rows (thead), but usually this specific table is simple
            
            if '修正1株配' in headers_list:
                target_table = tbl
                # Find index. Be careful if headers are complex, but usually '修正1株配' is unique enough
                try:
                    div_col_idx = headers_list.index('修正1株配')
                    # '決算期' should be there too
                    if '決算期' in headers_list:
                       period_col_idx = headers_list.index('決算期')
                except:
                    pass
                break
        
        if target_table and div_col_idx != -1:
            # Iterate rows to find the Forecast row
            rows = target_table.find_all('tr')
            for tr in rows:
                cols = tr.find_all(['td', 'th'])
                # Convert to text list
                col_texts = [td.get_text(strip=True) for td in cols]
                
                if not col_texts: continue
                
                # Check first column for "予" (Forecast)
                # Typically format: "連 予 2026.11"
                period_text = col_texts[period_col_idx]
                
                if '予' in period_text and len(col_texts) > div_col_idx:
                    # Get Dividend
                    div_str = col_texts[div_col_idx]
                    # Clean up "45", "45.0", "－"
                    if div_str and div_str != '－':
                        try:
                            div_amount = float(div_str.replace(',', ''))
                        except:
                            pass
                    
                    # Get Settlement Month
                    # "連 予 2026.11" -> extract 11
                    match = re.search(r'\.(\d+)', period_text)
                    if match:
                        settlement_month = int(match.group(1))
                    
                    # We found the main forecast row, break
                    if div_amount > 0 or settlement_month:
                        break

        # Fallback: if div_amount is 0.0, maybe try looking for "1株配当" again?
        # But this table method is usually superior for revisions/forecasts.

        return {
            'company_name': company_name,
            'dividend': div_amount,
            'settlement_month': settlement_month
        }

    except Exception as e:
        print(f"  Error parsing Kabutan: {e}")
        return None

def main():
    priority_tickers = get_priority_tickers()
    all_tickers = get_all_tickers()
    
    # Combine (Priority first)
    ticker_map = {t: True for t in priority_tickers}
    for t in all_tickers:
        ticker_map[t] = True
    sorted_tickers = list(ticker_map.keys())
    
    total = len(sorted_tickers)
    print(f"Processing {total} tickers (Kabutan Source)...")
    
    count = 0
    updated = 0
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    today_date = datetime.now().strftime('%Y-%m-%d')

    for ticker in sorted_tickers:
        if not ticker.isdigit():
            count += 1
            continue

        # Check if we already have good data (skip to save time, unless priority)
        is_priority = ticker in priority_tickers
        
        existing = c.execute("SELECT id, dividend_payment_month FROM revisions WHERE ticker = ? AND title = 'YahooFinance_Initial'", (ticker,)).fetchone()
        
        # If exists and has payment month and NOT priority, skip
        if existing and existing[1] and not is_priority:
            # print(f"[{count+1}/{total}] Skipping {ticker} (Done)")
            count += 1
            continue
            
        print(f"[{count+1}/{total}] Fetching {ticker}...")
        
        data = fetch_kabutan_dividend(ticker)
        time.sleep(1.0) # Polite sleep
        
        if data:
            print(f"  -> {data['company_name']} | Div: {data['dividend']} | Set: {data['settlement_month']}")
            
            # Logic:
            # Rights Month = Settlement Month
            # Payment Month = Settlement Month + 3 (approx)
            rights_month = data['settlement_month']
            payment_month = None
            
            if rights_month:
                payment_month = rights_month + 3
                if payment_month > 12: payment_month -= 12
            
            # Upsert
            if existing:
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
                    data['company_name'] or f"Company {ticker}",
                    data['dividend'],
                    rights_month,
                    payment_month,
                    now,
                    existing[0]
                ))
            else:
                c.execute("""
                    INSERT INTO revisions (
                        ticker, company_name, revision_date, title, 
                        dividend_forecast_annual, dividend_rights_month, dividend_payment_month, 
                        ai_analyzed, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
                """, (
                    ticker, 
                    data['company_name'] or f"Company {ticker}",
                    today_date,
                    'YahooFinance_Initial', # Keep same key for compatibility
                    data['dividend'],
                    rights_month,
                    payment_month,
                    now
                ))
            
            conn.commit()
            updated += 1
        else:
            print("  -> Failed/No Data")

        count += 1
        if count % 10 == 0: conn.commit()

    print(f"Finished. Updated {updated} stocks.")
    conn.close()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopped.")
