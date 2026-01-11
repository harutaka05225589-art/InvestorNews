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
        
        # New Logic based on HTML Inspection:
        # News/Earnings are in <table class="s_news_list"> matches
        # Ticker is in <td class="... oncodetip_code-data1" data-code="XXXX">
        # or <div data-code="XXXX"> inside a TD.
        # Event text is in a <span> or just text in the last <td>.
        
        tables = soup.find_all('table', class_='s_news_list')
        
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                try:
                    # Ticker: Look for ANY element with data-code attribute in this row
                    # The dump showed: <td><div data-code="4596">...</div></td>
                    code_el = row.find(attrs={"data-code": True})
                    if not code_el:
                        continue
                        
                    ticker = code_el.get('data-code')
                    if not ticker or not ticker.isdigit() or len(ticker) != 4:
                        continue
                        
                    # Text: The news summary is usually in the last <td> or a <span>
                    # Dump: <td><span class="fin_modal vtlink">窪田製薬ＨＤ、1-9月期(3Q累計)最終が…</span></td>
                    text_el = row.find('span', class_='fin_modal')
                    if not text_el:
                        # Fallback to the last cell's text
                        cells = row.find_all('td')
                        if cells:
                            text_el = cells[-1]
                    
                    if not text_el:
                         continue
                         
                    full_text = text_el.get_text().strip()
                    
                    # Split Name and Description
                    # Text format: "窪田製薬ＨＤ、1-9月期(3Q累計)最終が…"
                    # Usually "Name、Description"
                    if '、' in full_text:
                        name, desc = full_text.split('、', 1)
                        desc = desc # Keep the description
                    else:
                        name = "Unknown"
                        desc = full_text

                    # Determine type
                    ev_type = "発表"
                    if '1Q' in full_text or '第1' in full_text: ev_type = "1Q"
                    elif '2Q' in full_text or '第2' in full_text or '中間' in full_text: ev_type = "2Q"
                    elif '3Q' in full_text or '第3' in full_text: ev_type = "3Q"
                    elif '本決算' in full_text or '通期' in full_text: ev_type = "本決算"
                    elif '修正' in full_text: ev_type = "修正"
                    
                    # Filter: Only keep Earnings/Dividend/Forecast related
                    # Inspect '決算' div class? 
                    # Dump: <div class="newslist_ctg newsctg3_kk_b ...">決算</div>
                    # 'newsctg3' seems to correspond to category 3 (Earnings)
                    # We are querying category=3 so all should be relevant.
                    
                    events.append({
                        'ticker': ticker,
                        'name': name.strip(),
                        'date': date.strftime('%Y-%m-%d'),
                        'type': ev_type,
                        'desc': full_text
                    })
                except Exception as row_err:
                    continue

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
