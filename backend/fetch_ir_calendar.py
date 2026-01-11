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
                
            # Column mapping (Dynamic check):
            # Debug showed: ['1377', '東Ｐ', '', '', ...]
            # This implies Col 0 = Code, Col 1 = Market. Name is missing?
            # BUT usually Name is a link.
            # Let's inspect the HTML of Col 0 and Col 1 more deeply.
            
            # Try to grab Code and Name by <a> tags in the first few columns
            links = row.find_all('a')
            if not links: continue
            
            ticker = None
            name = None
            
            for link in links:
                txt = link.get_text().strip()
                href = link.get('href', '')
                
                # Check if text is 4 digit ticker
                if re.match(r'^\d{4}$', txt):
                    ticker = txt
                elif txt and not re.match(r'^\d+$', txt) and 'kabutan.jp' not in txt:
                    # Likely the name (not just a number)
                    # Exclude generic links if any
                    name = txt
            
            if not ticker:
                # Fallback: check Col 0 text
                col0_txt = cols[0].get_text().strip()
                if re.match(r'^\d{4}$', col0_txt):
                    ticker = col0_txt

            if not name:
                # Fallback: check Col 2 (index 1) or Col 3 (index 2) for text
                # Usually Col 0 = Code, Col 1 = Market, Col 2 = Name (sometimes)
                # Let's inspect available columns.
                if len(cols) > 2:
                    potential_name = cols[2].get_text().strip()
                    if potential_name:
                        name = potential_name
                
                if not name and len(cols) > 1:
                     # Sometimes Market is Col 1, Name is Col 2.
                     # But if Col 2 is empty, maybe it's in Col 1 mixed?
                     potential_name = cols[1].get_text().strip()
                     # Ignore "東Ｐ", "東Ｓ", "東Ｇ" (Market codes)
                     if potential_name and potential_name not in ["東Ｐ", "東Ｓ", "東Ｇ", "東Ｍ", "名Ｐ", "札証", "福証"]:
                         name = potential_name

            if not name:
                name = "Unknown"  

            # Extract Type (e.g. 本決算, etc)
            ev_type = "決算"
            row_text = row.get_text()
            if '1Q' in row_text or '第1' in row_text: ev_type = "1Q"
            elif '2Q' in row_text or '第2' in row_text or '中間' in row_text: ev_type = "2Q"
            elif '3Q' in row_text or '第3' in row_text: ev_type = "3Q"
            elif '本決算' in row_text or '通期' in row_text: ev_type = "本決算"
            
            # Verify it's a valid ticker
            if not ticker or not ticker.isdigit():
                continue

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

def run_fetch(days_back=5, days_forward=180):
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=days_back)
    end_date = today + datetime.timedelta(days=days_forward)
    
    print(f"Starting fetch from {start_date} to {end_date}...")
    
    current = start_date
    while current <= end_date:
        conn = get_db_connection()
        c = conn.cursor()
        date_str = current.strftime('%Y-%m-%d')
        # Check if we already have events for this date
        count = c.execute("SELECT count(*) FROM ir_events WHERE event_date = ?", (date_str,)).fetchone()[0]
        conn.close()
        
        if count > 0:
            print(f"Skipping {date_str} (Already has {count} events)")
            current += datetime.timedelta(days=1)
            continue
            
        events = fetch_events_for_date(current)
        save_events(events)
        current += datetime.timedelta(days=1)
        time.sleep(1) # Polite delay

if __name__ == "__main__":
    # Run slightly wider range by default
    run_fetch(days_back=1, days_forward=180)
