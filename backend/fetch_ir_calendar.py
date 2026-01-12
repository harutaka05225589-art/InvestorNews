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

def scan_valid_dates(start_date, end_date):
    """
    Crawls Kabutan Monthly Calendar (?mode=5_3) to find valid daily links 
    within the requested range.
    Returns: Sorted list of datetime.date objects.
    """
    valid_dates = set()
    base_url = "https://kabutan.jp/warning/?mode=5_3"
    
    # Calculate months to visit
    # Start from start_date's month, end at end_date's month
    current_m = start_date.replace(day=1)
    end_m = end_date.replace(day=1)
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print("  Scanning monthly calendar for valid dates...")
    
    while current_m <= end_m:
        ym_str = current_m.strftime('%Y%m')
        # For current month, we can use base_url or explicit date
        # Note: Kabutan might behave differently if we force date=YYYYMM for current month vs no param.
        # Safest is to use explicit date param for all queries to ensure we get the right month.
        url = f"{base_url}&date={ym_str}"
        
        # print(f"    Crawling month: {url}")
        try:
            res = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(res.text, 'html.parser')
            
            # DEBUG: Check what page we are actually on
            page_title = soup.find('title').get_text().strip() if soup.find('title') else "No Title"
            h1_text = soup.find('h1').get_text().strip() if soup.find('h1') else "No H1"
            print(f"    DEBUG: Page Title: {page_title[:30]}... | H1: {h1_text}")
            
            # Find all links to daily schedule
            # Relaxed regex: Just look for 8-digit date param.
            links = soup.find_all('a', href=re.compile(r'date=\d{8}'))
            print(f"    DEBUG: Raw links found: {len(links)}") # Detailed debug
            if len(links) > 0:
                print(f"    DEBUG: First link: {links[0].get('href')}")
            else:
                 # If no date links, print ANY links to see what's going on
                 all_links = soup.find_all('a')
                 print(f"    DEBUG: No date links. Total valid links on page: {len(all_links)}")
                 if len(all_links) > 0:
                     print(f"    DEBUG: Sample links: {[l.get('href') for l in all_links[:3]]}")
            
            for l in links:
                href = l.get('href')
                match = re.search(r'date=(\d{8})', href)
                if match:
                    d_str = match.group(1)
                    try:
                        d = datetime.datetime.strptime(d_str, '%Y%m%d').date()
                        if start_date <= d <= end_date:
                            valid_dates.add(d)
                    except ValueError:
                        pass
        except Exception as e:
            print(f"    Error scanning {url}: {e}")
        
        # Move to next month
        if current_m.month == 12:
            current_m = current_m.replace(year=current_m.year+1, month=1)
        else:
            current_m = current_m.replace(month=current_m.month+1)
        
        time.sleep(1)
        
    sorted_dates = sorted(list(valid_dates))
    print(f"  Found {len(sorted_dates)} valid dates in range.")
    return sorted_dates

def run_fetch(days_back=0, days_forward=180):
    """
    Scrapes IR events.
    Default: From today to 6 months ahead (approx 180 days).
    """
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=days_back)
    end_date = today + datetime.timedelta(days=days_forward)
    
    print(f"Starting fetch from {start_date} to {end_date}...")
    
    # 1. Scan for valid dates first using Monthly View
    # This avoids visiting future dates that don't exist yet (which redirect to today)
    target_dates = scan_valid_dates(start_date, end_date)
    
    if not target_dates:
        print("No valid dates found in scan.")
        return

    for current in target_dates:
        # Check if we already have events for this date?
        conn = get_db_connection()
        c = conn.cursor()
        date_str = current.strftime('%Y-%m-%d')
        count = c.execute("SELECT count(*) FROM ir_events WHERE event_date = ?", (date_str,)).fetchone()[0]
        conn.close()
        
        if count > 0:
            print(f"Skipping {date_str} (Already has {count} events)")
            continue
            
        events = fetch_events_for_date(current)
        save_events(events)
        time.sleep(1) # Polite delay

    print("Fetch cycle complete.")

if __name__ == "__main__":
    # If run directly as script, just run once.
    # For scheduler, use specific scheduler script or cron.
    run_fetch(days_back=7, days_forward=180)
    # End of script
