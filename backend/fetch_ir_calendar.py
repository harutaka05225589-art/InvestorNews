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
    date: datetime object
    """
    date_str = date.strftime('%Y%m%d')
    url = f"https://kabutan.jp/news/?date={date_str}&category=3"
    
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
        
        # Parse logic
        # Based on inspection, we need to find the list of articles.
        # Usually in <div class="main_body"> ... <ul class="news_list"> ...
        # Titles like "Toyota, 3Q Financial Results..."
        
        events = []
        news_list = soup.find('div', {'class': 'main_body'})
        
        # Debug: Print first 500 chars of main_body text if found
        if news_list:
            # Look for <a> tags inside
            links = news_list.find_all('a')
            for link in links:
                text = link.get_text().strip()
                # Example: "トヨタ <7203> [東証Ｐ] 決算 ..."
                # Regex to extract Ticker and Name
                match = re.search(r'(.+?)\s*<(\d{4})>', text)
                if match and ('決算' in text or '修正' in text):
                    name = match.group(1).strip()
                    ticker = match.group(2)
                    
                    # Determine type
                    ev_type = "決算"
                    if '1Q' in text or '第1' in text: ev_type = "1Q"
                    elif '2Q' in text or '第2' in text or '中間' in text: ev_type = "2Q"
                    elif '3Q' in text or '第3' in text: ev_type = "3Q"
                    elif '本決算' in text or '通期' in text: ev_type = "本決算"
                    elif '修正' in text: ev_type = "修正"
                    
                    link_url = link.get('href')
                    
                    events.append({
                        'ticker': ticker,
                        'name': name,
                        'date': date.strftime('%Y-%m-%d'),
                        'type': ev_type,
                        'desc': text
                    })
        else:
            print("  Warning: 'main_body' div not found.")

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
        events = fetch_events_for_date(current)
        save_events(events)
        current += datetime.timedelta(days=1)
        time.sleep(1) # Polite delay

if __name__ == "__main__":
    # By default verify with a small range, or use args
    # For now, let's run strict small range to verify
    run_fetch(days_back=1, days_forward=1)
