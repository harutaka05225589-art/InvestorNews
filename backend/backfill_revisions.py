import requests
from bs4 import BeautifulSoup
import datetime
import time
import sqlite3
from database import get_db_connection

# TDnet Public URL Pattern
TDNET_LIST_URL = "https://www.release.tdnet.info/inbs/I_list_001_{}.html"

def backfill_revisions(days_to_backfill=365):
    conn = get_db_connection()
    c = conn.cursor()
    
    print(f"Starting backfill for past {days_to_backfill} days...")
    
    total_saved = 0
    consecutive_errors = 0
    
    # Start from yesterday (avoid overlapping with today's live polling)
    start_date = datetime.datetime.now() - datetime.timedelta(days=1)
    
    for i in range(days_to_backfill):
        target_date = start_date - datetime.timedelta(days=i)
        date_str = target_date.strftime('%Y%m%d')
        formatted_date = target_date.strftime('%Y-%m-%d')
        url = TDNET_LIST_URL.format(date_str)
        
        print(f"[{i+1}/{days_to_backfill}] Fetching {formatted_date}: {url}", end="... ")
        
        try:
            res = requests.get(url, timeout=10)
            
            if res.status_code == 404:
                print("404 Not Found (Data retention limit reached?)")
                consecutive_errors += 1
                if consecutive_errors >= 5:
                    print("Stopping backfill due to multiple consecutive 404s.")
                    break
                continue
            
            if res.status_code != 200:
                print(f"HTTP {res.status_code}")
                continue

            consecutive_errors = 0 # Reset on success
            
            # Parse HTML
            soup = BeautifulSoup(res.content, 'html.parser')
            rows = soup.find_all('tr')
            
            daily_count = 0
            
            for row in rows:
                cols = row.find_all('td')
                if len(cols) < 4:
                    continue
                
                try:
                    code_text = cols[1].get_text().strip()
                    name_text = cols[2].get_text().strip()
                    title_text = cols[3].get_text().strip()
                    
                    # Filter for Revision
                    if "業績予想の修正" in title_text or "差異" in title_text:
                        ticker = code_text[:4]
                        
                        pdf_link = None
                        a_tag = cols[3].find('a')
                        if a_tag:
                            pdf_link = "https://www.release.tdnet.info/inbs/" + a_tag['href']

                        # Determine rough 'is_upward' from Title for UI fallback
                        # 3 = Backfilled/Skipped
                        
                        c.execute("""
                            INSERT INTO revisions 
                            (ticker, company_name, revision_date, source_url, quarter, title, ai_analyzed, ai_summary)
                            VALUES (?, ?, ?, ?, ?, ?, 3, '(Backfilled/No AI)')
                            ON CONFLICT(ticker, revision_date) DO NOTHING
                        """, (
                            ticker, 
                            name_text, 
                            formatted_date,
                            pdf_link,
                            "Unknown",
                            title_text
                        ))
                        
                        if c.rowcount > 0:
                            daily_count += 1
                            
                except Exception:
                    continue
            
            print(f"Saved {daily_count} revisions.")
            total_saved += daily_count
            conn.commit()
            
            # Be gentle
            time.sleep(1)
            
        except Exception as e:
            print(f"Error: {e}")
            
    conn.close()
    print(f"\nBackfill Completed. Total new records: {total_saved}")

if __name__ == "__main__":
    backfill_revisions()
