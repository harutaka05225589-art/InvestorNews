
import requests
from bs4 import BeautifulSoup
import sqlite3
import re
import time
import random
import os

# DB Helper
def get_db_connection():
    db_path = os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
    if not os.path.exists(db_path):
        db_path = 'investor_news.db'
    return sqlite3.connect(db_path)

# Helper for robust decoding
def decode_content(content):
    encodings = ['utf-8', 'shift_jis', 'euc-jp', 'cp932']
    for enc in encodings:
        try:
            return content.decode(enc)
        except: continue
    return content.decode('utf-8', errors='ignore')

def fetch_settlement_month_and_dividend(ticker):
    """
    Fetches 'Settlement Month' (決算月) and 'Dividend Forecast' (1株配) from Kabutan.
    Returns: { 'month': int, 'dividend': float } or None
    """
    url = f"https://kabutan.jp/stock/?code={ticker}"
    
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            print(f"  Error: Status {res.status_code}")
            return None
            
        text = decode_content(res.content)
        
        # Use html.parser which handles unicode strings from res.text better than lxml sometimes
        soup = BeautifulSoup(text, "html.parser")
        
        data = {}
        
        # Debug: Print all headers to see what we find
        all_th = soup.find_all('th')
        
        for th in all_th:
            text_th = th.get_text().strip()
            
            # Robust check for "決算"
            if "決算" in text_th and "発表" not in text_th and "推移" not in text_th: 
                td = th.find_next_sibling('td')
                if td:
                    val_text = td.get_text().strip()
                    match = re.search(r'(\d+)月', val_text)
                    if match:
                        data['month'] = int(match.group(1))
                        print(f"  [BS4] Found Month: {data['month']} (from {text_th})", flush=True)
                        break 
        
        # 2. Dividend Forecast
        for th in all_th:
            text_th = th.get_text().strip()
            if "1株配" in text_th or ("配当" in text_th and "利回り" not in text_th and "性向" not in text_th):
                 td = th.find_next_sibling('td')
                 if td:
                     val_text = td.get_text().strip()
                     # 24.00 or "－"
                     if "－" in val_text: continue
                     
                     # Extract float
                     try:
                         # Remove commas
                         clean_val = re.sub(r'[^\d\.]', '', val_text)
                         if clean_val:
                             data['dividend'] = float(clean_val)
                             # Break only if we are sure? 
                             # We usually want the Annual Total.
                             # Kabutan Basic Info table "1株配" is usually Annual Forecast/Actual.
                             break 
                     except: pass
        
        
        # 3. If Month not found, try "Earnings Trends" table (業績推移)
        # Look for table with th "決算期" in thead
        if 'month' not in data:
            # Find table with "決算期"
            tables = soup.find_all('table')
            for tbl in tables:
                # Check headers
                headers = [th.get_text().strip() for th in tbl.find_all('th')]
                if any("決算期" in h for h in headers):
                    # Found the table. Look at rows in tbody
                    rows = tbl.find_all('tr')
                    for row in rows:
                        # usually the first cell is the period, e.g. 2025.03
                        cells = row.find_all(['th', 'td'])
                        if not cells: continue
                        
                        first_cell = cells[0].get_text().strip()
                        # Match YYYY.MM pattern
                        match = re.search(r'\d{4}\.(\d{2})', first_cell)
                        if match:
                            data['month'] = int(match.group(1))
                            print(f"  [BS4] Found Month from Earnings Trends: {data['month']} (from {first_cell})", flush=True)
                            break
                    if 'month' in data: break

        # Fallback: Regex on res.text if BS4 failed
        if 'month' not in data:
            # STRICT Regex to avoid matching "決算発表" (Earnings Announcement)
            # We want headers that are EXACTLY "決算" or "決算期" or "本決算"
            # Pattern: <th ...> ... 決算 ... </th> ... <td ...> ... 3月 ... </td>
            
            # 1. >決算</th>
            # Using partial matching for attributes in th/td
            
            patterns = [
                r'>\s*決算\s*</th>\s*<td[^>]*>\s*(\d+)月',
                r'>\s*本決算\s*</th>\s*<td[^>]*>\s*(\d+)月',
                r'>\s*決算期\s*</th>\s*<td[^>]*>\s*(\d+)月',
                 # Catch-all loose but avoid explicit "発表"
                 # Look for "決算" that is NOT followed by "発表"
                 r'決算(?!発表).*?</th>\s*<td[^>]*>\s*(\d+)月'
            ]
            
            for pat in patterns:
                match = re.search(pat, text, re.IGNORECASE | re.DOTALL)
                if match:
                    data['month'] = int(match.group(1))
                    print(f"  [Fallback] Regex strict found Month: {data['month']}", flush=True)
                    break

        if 'dividend' not in data:
            # Look for 1株配</th>.*?(\d+\.?\d*)
            match = re.search(r'1株配.*?</th>\s*<td[^>]*>.*?(\d+\.?\d*)', text, re.DOTALL)
            if match:
                 try:
                     clean_val = re.sub(r'[^\d\.]', '', match.group(1))
                     data['dividend'] = float(clean_val)
                     print(f"  [Fallback] Regex found Dividend: {data['dividend']}", flush=True)
                 except: pass

        return data if data else None

    except Exception as e:
        print(f"  Fetch Error: {e}")
        return None

def update_dividend_months():
    conn = get_db_connection()
    c = conn.cursor()
    
    tickers_to_process = set()
    
    # Portfolio
    priority_tickers = set()
    try:
        c.execute("SELECT DISTINCT ticker FROM portfolio_transactions")
        for row in c.fetchall():
            priority_tickers.add(row[0])
            tickers_to_process.add(row[0])
    except: pass
    
    # Active Revisions (Dividend Forecasts)
    c.execute("""
        SELECT DISTINCT ticker FROM revisions 
        WHERE dividend_forecast_annual IS NOT NULL 
        ORDER BY revision_date DESC 
        LIMIT 50
    """)
    for row in c.fetchall():
        tickers_to_process.add(row[0])

    # Specifically add 1726 for testing if missed
    tickers_to_process.add('1726')
    tickers_to_process.add('7203') # Toyota
    
    print(f"Targeting {len(priority_tickers)} priority tickers from portfolio.", flush=True)
    
    # PRIORITIZE 1726
    if "1726" in tickers_to_process:
        tickers_to_process.remove("1726")
    sorted_tickers = ["1726"] + list(tickers_to_process)
    
    # Filter valid tickers (4 digits)
    valid_tickers = [t for t in sorted_tickers if t and t.isdigit() and len(t) == 4]
    
    print(f"Processing {len(valid_tickers)} tickers: {valid_tickers[:5]}...", flush=True)
    
    for ticker in valid_tickers:
        print(f"--- Processing {ticker} ---", flush=True)
        
        # 1. Check if we have a dividend record to update
        c.execute("""
            SELECT id, dividend_rights_month, dividend_payment_month, dividend_forecast_annual 
            FROM revisions 
            WHERE ticker = ? 
            ORDER BY revision_date DESC, id DESC 
            LIMIT 1
        """, (ticker,))
        row = c.fetchone()
        
        if not row:
            print("  No existing revision record found. Creating new one.", flush=True)
            # Create a placeholder row
            now = time.strftime('%Y-%m-%d %H:%M:%S')
            today = time.strftime('%Y-%m-%d')
            c.execute("""
                INSERT INTO revisions (ticker, company_name, revision_date, title, ai_analyzed, created_at)
                VALUES (?, ?, ?, 'System_Dividend_Update', 1, ?)
                RETURNING id
            """, (ticker, f"Company {ticker}", today, now))
            rev_id = c.fetchone()[0]
            current_rights = None
            current_payment = None
            current_forecast = None
            print(f"  Created new Revision ID {rev_id}", flush=True)
        else:
            rev_id, current_rights, current_payment, current_forecast = row
        
        # 2. Fetch from Kabutan
        kabutan_data = fetch_settlement_month_and_dividend(ticker)
        
        if kabutan_data:
            month = kabutan_data.get('month')
            amount = kabutan_data.get('dividend')
            
            updates = []
            params = []
            
            if month:
                rights = month
                payment = rights + 3
                if payment > 12: payment -= 12
                
                updates.append("dividend_rights_month = ?")
                updates.append("dividend_payment_month = ?")
                params.append(rights)
                params.append(payment)
                print(f"  Scraped: Rights={rights}, Est. Payment={payment}", flush=True)
            
            if amount is not None:
                # Update forecast if missing OR if explicitly 'System_Dividend_Update'
                if current_forecast is None:
                    updates.append("dividend_forecast_annual = ?")
                    params.append(amount)
                    print(f"  Scraped: Dividend={amount}", flush=True)
            
            if updates:
                # Update ALL recent revisions for this ticker to ensure getLatestDividend picks it up
                # regardless of which specific revision it selects (e.g. one with forecast vs one without)
                sql = f"UPDATE revisions SET {', '.join(updates)} WHERE ticker = ? AND id IN (SELECT id FROM revisions WHERE ticker = ? ORDER BY revision_date DESC LIMIT 50)"
                params.append(ticker)
                params.append(ticker)
                c.execute(sql, params)
                conn.commit()
                print("  Updated DB (Top 50 revisions).", flush=True)
            else:
                print("  No updates needed (Data matches or partial scrape failed).", flush=True)
        else:
            print("  Failed to scrape Kabutan data.", flush=True)

        time.sleep(1 + random.random())

    conn.close()
    print("Done.", flush=True)

if __name__ == "__main__":
    update_dividend_months()
