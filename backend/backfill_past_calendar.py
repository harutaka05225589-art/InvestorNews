import requests
from bs4 import BeautifulSoup
import datetime
import time
import sqlite3
import os
import re

# Database path (Same as fetch_ir_calendar.py)
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def fetch_past_events_for_date(date):
    """
    Fetches PAST earnings announcements using the NEWS endpoint.
    URL: https://kabutan.jp/news/?date=YYYYMMDD&category=3
    Category 3 = Earnings Flash (決算速報) - reliable for past data.
    """
    date_str = date.strftime('%Y%m%d')
    url = f"https://kabutan.jp/news/?date={date_str}&category=3"
    
    print(f"Fetching Past: {url}")
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
        
        # In the NEWS section, links are typically just list items.
        # We look for <a> tags containing stock code <XXXX>.
        links = soup.find_all('a')
        
        for link in links:
            text = link.get_text().strip()
            # Regex to extract Name and Ticker <Code>
            # e.g. "Toyota <7203> [TSE P] Financial Results..."
            match = re.search(r'(.+?)\s*<(\d{4})>', text)
            
            if match: 
                 # Filter by keywords to ensure it's an earnings report
                if any(k in text for k in ['決算', '修正', '配当', '業績', '短信', '上振れ', '下振れ']):
                    name = match.group(1).strip()
                    ticker = match.group(2)
                    
                    # Determine type
                    ev_type = "発表"
                    if '1Q' in text or '第1' in text: ev_type = "1Q"
                    elif '2Q' in text or '第2' in text or '中間' in text: ev_type = "2Q"
                    elif '3Q' in text or '第3' in text: ev_type = "3Q"
                    elif '本決算' in text or '通期' in text: ev_type = "本決算"
                    elif '修正' in text: ev_type = "修正"
                    
                    events.append({
                        'ticker': ticker,
                        'name': name,
                        'date': date.strftime('%Y-%m-%d'),
                        'type': ev_type,
                        'desc': text
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
        try:
            # Check duplicate (ticker, date)
            c.execute("SELECT id FROM ir_events WHERE ticker = ? AND event_date = ?", (e['ticker'], e['date']))
            if not c.fetchone():
                c.execute("""
                    INSERT INTO ir_events (ticker, company_name, event_date, event_type, description)
                    VALUES (?, ?, ?, ?, ?)
                """, (e['ticker'], e['name'], e['date'], e['type'], e['desc']))
                unique_count += 1
        except Exception as err:
            print(f"  Save Error: {err}")
            
    conn.commit()
    conn.close()
    if unique_count > 0:
        print(f"  Saved {unique_count} new events.")

def run_backfill(days_back=365):
    today = datetime.date.today()
    # Start from yesterday, go back 'days_back' days
    start_date = today - datetime.timedelta(days=days_back)
    end_date = today - datetime.timedelta(days=1)
    
    print(f"Starting Backfill from {end_date} back to {start_date}...")
    
    # Iterate backwards (recent first)
    current = end_date
    while current >= start_date:
        events = fetch_past_events_for_date(current)
        save_events(events)
        current -= datetime.timedelta(days=1)
        time.sleep(1) # Polite delay

if __name__ == "__main__":
    # Run backfill for roughly 1 year
    run_backfill(days_back=365)
