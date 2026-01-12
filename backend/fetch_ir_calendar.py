import requests
from bs4 import BeautifulSoup
import datetime
import time
import sqlite3
import os
import re
import pandas as pd
import io

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def fetch_jpx_data():
    """
    Fetches IR Calendar data from JPX (Japan Exchange Group) Excel files.
    Target: https://www.jpx.co.jp/listing/event-schedules/financial-announcement/index.html
    """
    base_url = "https://www.jpx.co.jp"
    page_url = "https://www.jpx.co.jp/listing/event-schedules/financial-announcement/index.html"
    
    print(f"Fetching JPX Page: {page_url}")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    try:
        res = requests.get(page_url, headers=headers)
        if res.status_code != 200:
            print(f"Failed to fetch JPX page: {res.status_code}")
            return

        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Find all excel links
        links = soup.find_all('a', href=re.compile(r'\.xlsx$'))
        print(f"Found {len(links)} Excel files.")
        
        total_events_saved = 0
        
        for i, link in enumerate(links):
            file_url = base_url + link.get('href')
            print(f"Downloading [{i+1}/{len(links)}]: {file_url}")
            
            f_res = requests.get(file_url, headers=headers)
            if f_res.status_code != 200:
                print("  Failed download.")
                continue
                
            try:
                # Read with pandas
                # Note: The header row seems to be row 0 (or implicit). 
                # Debugging showed Col 0 = Date, Col 1 = Ticker, Col 2 = Name
                # We interpret without header initially to be safe or inspect first row.
                # Actually, pandas likely picks up the first row as columns.
                # Let's read with header=0 (default)
                df = pd.read_excel(io.BytesIO(f_res.content))
                
                # Convert to string and handle formatting
                events = []
                
                # Iterate rows
                for index, row in df.iterrows():
                    # Check if Row is valid data
                    # Required: Date in Col 0, Ticker in Col 1
                    try:
                        # Access by index position (safer than name)
                        # iloc[row_idx, col_idx]
                        # row is a Series, so row.iloc[0]
                        
                        raw_date = row.iloc[0]
                        raw_ticker = row.iloc[1]
                        raw_name = row.iloc[2]
                        
                        # Validate Ticker (must be 4 digits)
                        ticker_str = str(raw_ticker).strip()
                        if not re.match(r'^\d{4}$', ticker_str):
                            continue
                            
                        # Validate Date
                        # Pandas usually parses dates as Timestamp
                        target_date = None
                        if isinstance(raw_date, datetime.datetime):
                            target_date = raw_date.date()
                        else:
                            # Try parsing string
                            try:
                                target_date = pd.to_datetime(raw_date).date()
                            except:
                                continue
                        
                        if not target_date: continue
                        
                        name = str(raw_name).strip()
                        
                        events.append({
                            'ticker': ticker_str,
                            'name': name,
                            'date': target_date.strftime('%Y-%m-%d'),
                            'type': '決算',
                            'desc': f"{name} ({ticker_str}) 決算発表予定"
                        })
                        
                    except Exception as e:
                        # Skip row parsing error
                        continue
                
                print(f"  Parsed {len(events)} events.")
                count = save_events(events)
                total_events_saved += count
                
            except Exception as e:
                print(f"  Error reading Excel: {e}")

        print(f"JPX Fetch Complete. Total new events: {total_events_saved}")

    except Exception as e:
        print(f"Error in fetch_jpx_data: {e}")

def save_events(events):
    if not events: return 0
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
            else:
                # Optional: Update name if previously "Unknown"
                c.execute("SELECT company_name FROM ir_events WHERE ticker = ? AND event_date = ?", (e['ticker'], e['date']))
                curr_name = c.fetchone()[0]
                if (curr_name == 'Unknown' or curr_name is None) and e['name'] != 'Unknown':
                    c.execute("UPDATE ir_events SET company_name = ? WHERE ticker = ? AND event_date = ?", (e['name'], e['ticker'], e['date']))

        except Exception as ex:
            print(f"Error saving row {e}: {ex}")
            
    conn.commit()
    conn.close()
    return unique_count

def run_fetch(days_back=0, days_forward=180):
    """
    Main entry point suitable for schedule or manual run.
    Now redirects to fetch_jpx_data.
    Args are ignored but kept for compatibility.
    """
    print(f"Starting IR Fetch (JPX Source)...")
    fetch_jpx_data()

if __name__ == "__main__":
    run_fetch()
