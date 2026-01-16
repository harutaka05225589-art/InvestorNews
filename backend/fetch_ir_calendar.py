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
                
                # Debug: Print first 5 rows raw content
                print("DEBUG: Showing first 3 rows of Excel data:")
                print(df.head(3).to_string())
                print("------------------------------------------")
                
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

                        # Debug: Print the first valid row found to check columns
                        # Removed debug print block
                            
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
                        
                        # Try to get Title/Type from Col 7 (Index 7)
                        # JPX format (observed): Date, Ticker, Name, EnglishName, ?, ?, ?, QuarterInfo, ...
                        raw_title = ""
                        if len(row) > 7:
                            raw_title = str(row.iloc[7]).strip()
                        
                        # Determine Type
                        event_type = '決算' # Default
                        desc = f"{name} ({ticker_str}) 決算発表予定"
                        
                        if raw_title:
                            desc = f"{name} ({ticker_str}) {raw_title}"
                            if '第１' in raw_title or '第1' in raw_title or '1Q' in raw_title:
                                event_type = '1Q'
                            elif '第２' in raw_title or '第2' in raw_title or '2Q' in raw_title or '中間' in raw_title:
                                event_type = '2Q'
                            elif '第３' in raw_title or '第3' in raw_title or '3Q' in raw_title:
                                event_type = '3Q'
                            elif '本決算' in raw_title or '通期' in raw_title or '決算短信' in raw_title:
                                event_type = '4Q'

                        events.append({
                            'ticker': ticker_str,
                            'name': name,
                            'date': target_date.strftime('%Y-%m-%d'),
                            'type': event_type,
                            'desc': desc
                        })
                        
                    except Exception as e:
                        # Skip row parsing error
                        continue
                
                print(f"  Parsed {len(events)} events.")
                updated, new = save_events(events)
                total_events_saved += new
                print(f"  Saved: {new} new, {updated} updated.")
                
            except Exception as e:
                print(f"  Error reading Excel: {e}")

        print(f"JPX Fetch Complete. Total new: {total_events_saved}")

    except Exception as e:
        print(f"Error in fetch_jpx_data: {e}")

def save_events(events):
    if not events: return 0, 0
    conn = get_db_connection()
    c = conn.cursor()
    
    new_count = 0
    update_count = 0
    
    for e in events:
        try:
            # Check duplicate (ticker, date)
            c.execute("SELECT id, event_type FROM ir_events WHERE ticker = ? AND event_date = ?", (e['ticker'], e['date']))
            row = c.fetchone()
            
            if not row:
                c.execute("""
                    INSERT INTO ir_events (ticker, company_name, event_date, event_type, description)
                    VALUES (?, ?, ?, ?, ?)
                """, (e['ticker'], e['name'], e['date'], e['type'], e['desc']))
                new_count += 1
            else:
                # Update existing record
                c.execute("""
                    UPDATE ir_events 
                    SET event_type = ?, description = ?, company_name = ?
                    WHERE ticker = ? AND event_date = ?
                """, (e['type'], e['desc'], e['name'], e['ticker'], e['date']))
                update_count += 1

        except Exception as ex:
            print(f"Error saving row {e}: {ex}")
            
    conn.commit()
    conn.close()
    return update_count, new_count

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
