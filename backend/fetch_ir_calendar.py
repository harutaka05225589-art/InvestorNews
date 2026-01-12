import requests
from bs4 import BeautifulSoup
import datetime
import time
import sqlite3
import os
import re

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def fetch_events_for_date(requested_date):
    """
    Fetches earnings announcements for a specific date from Kabutan.
    Target: Earnings Schedule Page (決算発表予定)
    URL: https://kabutan.jp/warning/?mode=5_1&date=YYYYMMDD
    Note: The page might ignore the date param and show the "next" schedule.
    We must parse the ACTUAL date from the page content.
    """
    date_str = requested_date.strftime('%Y%m%d')
    url = f"https://kabutan.jp/warning/?mode=5_1&date={date_str}"
    
    print(f"Fetching: {url}")
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = res.apparent_encoding
        
        if res.status_code != 200:
            print(f"  Failed: {res.status_code}")
            return []

        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 1. Attempt to find the ACTUAL date from the page header
        # Header usually looks like: <h1>1月14日の決算発表予定銘柄</h1> or <h2>...</h2>
        header_date = None
        
        # Try finding H1 first (most common for schedule page)
        header_tag = soup.find('div', id='main_body').find('h1') if soup.find('div', id='main_body') else soup.find('h1')
        
        # Fallback to H2 if H1 not found
        if not header_tag:
            header_tag = soup.find('div', id='main_body').find('h2') if soup.find('div', id='main_body') else soup.find('h2')

        if header_tag:
            header_text = header_tag.get_text().strip()
            # Extract month and day: (\d+)月(\d+)日
            date_match = re.search(r'(\d+)月(\d+)日', header_text)
            if date_match:
                month = int(date_match.group(1))
                day = int(date_match.group(2))
                year = requested_date.year
                header_date = datetime.date(year, month, day)
        
        # Use the extracted date if found, otherwise fallback to requested_date (risky but necessary)
        target_date = header_date if header_date else requested_date
        print(f"  Page Date: {target_date} (Requested: {requested_date})")
        
        # Guard: If the page redirected us to a completely different date (e.g. "Next available" date),
        # we should treat this as "No data for requested date" and skip saving it as the requested date.
        # Otherwise we overwrite 2026-01-13 with data from 2026-07-05 (which is actually just 2026-01-13 content)
        if header_date and header_date != requested_date:
            print(f"  > Notice: Page date {header_date} differs from requested {requested_date}. Skipping to avoid duplicate/incorrect data.")
            return []


        events = []
        
        # Look for the main schedule table
        table = soup.find('table', class_='tablesorter')
        if not table:
            tables = soup.find_all('table')
            for t in tables:
                if 'コード' in t.get_text():
                    table = t
                    break
        
        if not table:
            print("  No schedule table found.")
            return []

        rows = table.find_all('tr')
        
        for row in rows:
            cols = row.find_all(['td', 'th']) # Look for both td and th
            if not cols or len(cols) < 3:
                continue
                
            # Debug showed: ['1377', '東Ｐ', '', '', ...]
            # This implies Col 0 = Code, Col 1 = Market. Name is missing?
            # BUT usually Name is a link.
            # Let's inspect the HTML of Col 0 and Col 1 more deeply.
            
            # Extract Ticker and Name
            ticker = None
            name = None
            
            # Helper to check if text is a market code
            def is_market_code(txt):
                # Common market codes on Kabutan
                known_codes = ['東P', '東S', '東G', '名P', '名M', '札', '福', '東証プライム', '東証スタンダード', '東証グロース']
                if txt in known_codes: return True
                # Regex for variations (e.g. full width)
                if re.match(r'^[東名札福][証]?[PGMS12１２ＰＧＭＳ\s]*$', txt): return True
                return False

            # 1. Try to find link (Best Source)
            links = row.find_all('a')
            if links:
                for link in links:
                    txt = link.get_text().strip()
                    # Check URL to confirm it's a stock link
                    href = link.get('href', '')
                    
                    if re.match(r'^\d{4}$', txt):
                        ticker = txt
                    elif txt and not txt.isdigit() and 'kabutan' not in txt:
                        # Candidate for name
                        if not is_market_code(txt):
                            name = txt
            
            # 2. Fallback: Text columns
            if not ticker and cols:
                t = cols[0].get_text().strip()
                if re.match(r'^\d{4}$', t): ticker = t
            
            if not name:
                # Try Col 2 (Name often here)
                if len(cols) > 2:
                    t = cols[2].get_text().strip()
                    if t and not is_market_code(t): name = t
                
                # Try Col 1 if still missing (Sometimes market is Col 2, Name Col 1? Rare but possible)
                if not name and len(cols) > 1:
                    t = cols[1].get_text().strip()
                    if t and not is_market_code(t) and not t.isdigit(): name = t

            # 3. SAFETY NET: DB Lookup for Name
            # If name is missing OR looks like a market code (double check), find it in our history.
            if ticker and (not name or is_market_code(name) or name == "Unknown"):
                try:
                    conn_lookup = get_db_connection()
                    c_lookup = conn_lookup.cursor()
                    # Look for ANY record with this ticker that has a valid-looking name
                    c_lookup.execute("""
                        SELECT company_name FROM ir_events 
                        WHERE ticker = ? 
                        AND company_name NOT LIKE '東%' 
                        AND company_name NOT LIKE '名%' 
                        AND length(company_name) > 1
                        ORDER BY event_date DESC LIMIT 1
                    """, (ticker,))
                    row_data = c_lookup.fetchone()
                    conn_lookup.close()
                    if row_data:
                        name = row_data[0]
                        # print(f"    [Recovered Name] {ticker} -> {name}")
                except Exception:
                    pass
            
            if not name:
                name = "Unknown"  

            # Extract Type
            ev_type = "決算"
            row_text = row.get_text()
            if '1Q' in row_text or '第1' in row_text: ev_type = "1Q"
            elif '2Q' in row_text or '第2' in row_text or '中間' in row_text: ev_type = "2Q"
            elif '3Q' in row_text or '第3' in row_text: ev_type = "3Q"
            elif '本決算' in row_text or '通期' in row_text: ev_type = "本決算"
            
            if not ticker or not ticker.isdigit(): continue

            events.append({
                'ticker': ticker,
                'name': name,
                'date': target_date.strftime('%Y-%m-%d'), 
                'type': ev_type,
                'desc': f"{name} ({ticker}) {ev_type}発表予定"
            })
            
        # De-duplicate events in this batch before returning
        unique_events = []
        seen = set()
        for e in events:
            key = (e['ticker'], e['date'])
            if key not in seen:
                seen.add(key)
                unique_events.append(e)

        print(f"  Found {len(unique_events)} events.")
        return unique_events

    except Exception as e:
        print(f"  Error: {e}")
        return []

def save_events(events):
    if not events: return
    conn = get_db_connection()
    c = conn.cursor()
    
    unique_count = 0
    for e in events:
        # Check duplicate (ticker, date)
        c.execute("SELECT id FROM ir_events WHERE ticker = ? AND event_date = ?", (e['ticker'], e['date']))
        if not c.fetchone():
            c.execute("""
                INSERT INTO ir_events (ticker, company_name, event_date, event_type, description)
                VALUES (?, ?, ?, ?, ?)
            """, (e['ticker'], e['name'], e['date'], e['type'], e['desc']))
            unique_count += 1
            
    conn.commit()
    conn.close()
    print(f"  Saved {unique_count} new events.")

def fetch_events_from_finance_url(requested_date):
    """
    Fallback: method to fetch from /stock/finance URL
    URL: https://kabutan.jp/stock/finance?code=&date=YYYY/MM/DD
    """
    date_str = requested_date.strftime('%Y/%m/%d')
    url = f"https://kabutan.jp/stock/finance?code=&date={date_str}"
    
    print(f"  Fetching Fallback: {url}")
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0'
        }
        res = requests.get(url, headers=headers, timeout=10)
        res.encoding = res.apparent_encoding
        if res.status_code != 200: return []
        
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Parse logic similar to above but generic for tables
        events = []
        tables = soup.find_all('table')
        if not tables: return []
        
        # Usually the main list is in one of the tables.
        # We look for rows with a ticker code.
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                cols = row.find_all(['td', 'th'])
                if not cols: continue
                
                # Check for ticker in text
                row_txt = row.get_text()
                # Simple extraction: Find first 4-digit sequence
                match = re.search(r'\b(\d{4})\b', row_txt)
                if not match: continue
                ticker = match.group(1)
                
                # Extract Name (Exclude generic text)
                name = None
                links = row.find_all('a')
                for l in links:
                    txt = l.get_text().strip()
                    if not txt.isdigit() and len(txt) > 1 and "kabutan" not in txt:
                        name = txt
                        break
                
                # Fallback name from columns
                if not name and len(cols) > 1:
                    # Heuristic: Column that corresponds to name
                    # usually Col 1 or 2
                    for i in [1, 2, 0]:
                        if i < len(cols):
                            t = cols[i].get_text().strip()
                            if t and not t.isdigit() and len(t) > 1 and not is_market_code(t):
                                name = t
                                break
                                
                if not name: name = "Unknown"
                if is_market_code(name): name = "Unknown"

                # DB Lookup for Unknown Name
                if name == "Unknown":
                    conn = get_db_connection()
                    c = conn.cursor()
                    c.execute("SELECT company_name FROM ir_events WHERE ticker = ? AND company_name != 'Unknown' ORDER BY event_date DESC LIMIT 1", (ticker,))
                    row_data = c.fetchone()
                    conn.close()
                    if row_data: name = row_data[0]

                events.append({
                    'ticker': ticker,
                    'name': name,
                    'date': requested_date.strftime('%Y-%m-%d'),
                    'type': '決算', # Assume earnings
                    'desc': f"{name} ({ticker}) 決算発表予定"
                })
        
        # Dedup
        unique_events = []
        seen = set()
        for e in events:
            if e['ticker'] not in seen:
                seen.add(e['ticker'])
                unique_events.append(e)
                
        print(f"  Found {len(unique_events)} events from Fallback.")
        return unique_events

    except Exception as e:
        print(f"  Error in fallback: {e}")
        return []

def is_market_code(txt):
    # Re-define or reuse helper
    known_codes = ['東P', '東S', '東G', '名P', '名M', '札', '福', '東証プライム', '東証スタンダード', '東証グロース']
    if txt in known_codes: return True
    if re.match(r'^[東名札福][証]?[PGMS12１２ＰＧＭＳ\s]*$', txt): return True
    if txt in ['プライム', 'スタンダード', 'グロース']: return True
    return False

def run_fetch(days_back=0, days_forward=180):
    """
    Scrapes IR events.
    Default: From today to 6 months ahead (approx 180 days).
    """
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=days_back)
    end_date = today + datetime.timedelta(days=days_forward)
    
    print(f"Starting fetch from {start_date} to {end_date}...")
    print("VERSION 2.0: Using Fallback Logic")
    
    current = start_date
    while current <= end_date:
        date_str = current.strftime('%Y-%m-%d')
        
        # Check if already exists?
        conn = get_db_connection()
        c = conn.cursor()
        count = c.execute("SELECT count(*) FROM ir_events WHERE event_date = ?", (date_str,)).fetchone()[0]
        conn.close()
        
        if count > 0:
            print(f"Skipping {date_str} (Already has {count} events)")
            current += datetime.timedelta(days=1)
            continue

        # Try Primary URL (Warning)
        events = fetch_events_for_date(current)
        
        # If Primary returned empty, try Fallback URL (Stock Finance)
        if not events:
            events = fetch_events_from_finance_url(current)
            
        save_events(events)
        current += datetime.timedelta(days=1)
        time.sleep(1) # Polite delay

    print("Fetch cycle complete.")

if __name__ == "__main__":
    run_fetch(days_back=7, days_forward=180) # Default manual run
