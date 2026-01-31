
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
    url = f"https://kabutan.jp/stock/?code={ticker}"
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
        # Try multiple selectors for name
        name_tag = soup.select_one('div.si_i1_1 h2') or soup.select_one('h2')
        if name_tag:
            company_name = name_tag.text.strip()

        # 2. Dividend (Annual) - Robust Search
        div_amount = 0.0
        
        # Find "1株配当" text node
        div_label = soup.find(string=re.compile(r'1株配当'))
        if div_label:
            # Go up to the row/definition list
            parent = div_label.parent
            # Traverse siblings to find the value (usually in a <dd> or <td class="v_dd_b">)
            # Strategy: look at the NEXT element or parent's next sibling
            
            # Case 1: <dl><dt>1株配当</dt><dd>35.0</dd></dl>
            if parent.name == 'dt':
                dd = parent.find_next_sibling('dd')
                if dd:
                    val_str = dd.text.replace('円', '').strip()
                    try: div_amount = float(val_str)
                    except: pass
            
            # Case 2: <table><tr><th>1株配当</th><td>35.0</td></tr></table>
            elif parent.name == 'th' or parent.name == 'td':
                td = parent.find_next_sibling('td')
                if td:
                    val_str = td.text.replace('円', '').strip()
                    try: div_amount = float(val_str)
                    except: pass
            
            # Case 3: Just search for the number nearby if above failed
            if div_amount == 0.0:
                # Look for the immediate next text that looks like a number
                pass
        
        # 3. Settlement Month (決算期)
        settlement_month = None
        set_label = soup.find(string=re.compile(r'決算期'))
        if set_label:
            parent = set_label.parent
            target_str = ""
            if parent.name == 'dt':
                dd = parent.find_next_sibling('dd')
                if dd: target_str = dd.text
            elif parent.name == 'th' or parent.name == 'td':
                td = parent.find_next_sibling('td')
                if td: target_str = td.text
            
            if target_str:
                m_str = target_str.replace('月', '').strip()
                match = re.search(r'(\d+)', m_str)
                if match:
                    settlement_month = int(match.group(1))

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
