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

def fetch_events_for_date(date):
    """
    Fetches earnings announcements for a specific date from Kabutan.
    Target: Earnings Schedule Page (決算発表予定)
    URL: https://kabutan.jp/warning/?mode=5_1&date=YYYYMMDD
    """
    date_str = date.strftime('%Y%m%d')
    # Using the "Earnings Schedule" endpoint (warning mode=5_1)
    # Note: query param might be ?date= or ?day=, Kabutan often accepts ?date= for news.
    # For warning section, if date param is ignored, it usually shows "Upcoming". 
    # We will try passing date.
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
        
        events = []
        
        # Look for the main schedule table
        # Structure observed: table.tablesorter (or just the main table in #contents)
        table = soup.find('table', class_='tablesorter')
        if not table:
            # Fallback: try finding first table with "コード" in header
            tables = soup.find_all('table')
            for t in tables:
                if 'コード' in t.get_text():
                    table = t
                    break
        
        if not table:
            print("  No schedule table found.")
            return []

        # Iterate rows (skip header if typically <thead> or first row has th)
        rows = table.find_all('tr')
        
        for row in rows:
            cols = row.find_all('td')
            if not cols or len(cols) < 3:
                continue
                
            # Expected columns (based on standard Kabutan schedule):
            # 0: Code (Ticker) link
            # 1: Name link
            # 2: Market
            # 3: Period/Type
            
            # Extract Code
            code_col = cols[0]
            ticker_link = code_col.find('a')
            if not ticker_link: continue
            ticker = ticker_link.get_text().strip()
            
            # Extract Name
            name_col = cols[1]
            name = name_col.get_text().strip()
            
            # Extract Type (e.g. 本決算, etc) if available
            # Note: The table structure might vary. Let's try to find "決算" text in row or just default.
            ev_type = "決算"
            row_text = row.get_text()
            if '1Q' in row_text or '第1' in row_text: ev_type = "1Q"
            elif '2Q' in row_text or '第2' in row_text: ev_type = "2Q"
            elif '3Q' in row_text or '第3' in row_text: ev_type = "3Q"
            elif '本決算' in row_text: ev_type = "本決算"
            
            # Verify it's a valid ticker
            if not ticker.isdigit():
                continue

            events.append({
                'ticker': ticker,
                'name': name,
                'date': date.strftime('%Y-%m-%d'),
                'type': ev_type,
                'desc': f"{name} ({ticker}) {ev_type}発表予定"
            })

        print(f"  Found {len(events)} events.")
        return events

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

def run_fetch(days_back=5, days_forward=30):
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=days_back)
    end_date = today + datetime.timedelta(days=days_forward)
    
    current = start_date
    while current <= end_date:
        # Check if we already have events for this date?
        # User requested "no refetch for acquired data".
        # We can do a quick check: count events for this date. If > 0, skip.
        # But wait, what if new events are added? 
        # User explicitly said "once acquired data requires no re-acquisition". 
        # So we strict skip if count > 0 in DB.
        
        conn = get_db_connection()
        c = conn.cursor()
        date_str = current.strftime('%Y-%m-%d')
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
    # By default verify with a small range, or use args
    # For now, let's run strict small range to verify
    run_fetch(days_back=1, days_forward=1)
