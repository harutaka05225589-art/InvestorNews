import requests
from bs4 import BeautifulSoup
import datetime
import sqlite3
import os
import re
import time
from database import get_db_connection

# TDnet Public URL Pattern
# YYYYMMDD format
TDNET_LIST_URL = "https://www.release.tdnet.info/inbs/I_list_001_{}.html"

def fetch_tdnet_revisions(target_date=None):
    if not target_date:
        target_date = datetime.datetime.now()
    
    date_str = target_date.strftime('%Y%m%d')
    url = TDNET_LIST_URL.format(date_str)
    
    print(f"Fetching TDnet for {date_str}: {url}")
    
    try:
        res = requests.get(url, timeout=10)
        if res.status_code != 200:
            print(f"  TDnet fetch failed: {res.status_code}")
            return
        
        # Parse HTML
        soup = BeautifulSoup(res.content, 'html.parser')
        
        # TDnet structure: Table rows <tr>
        # Columns changes but usually: Time, Code, Company, Title, PDF Link...
        # We look for "業績予想の修正" in titles
        
        conn = get_db_connection()
        c = conn.cursor()
        
        count = 0
        
        # Find all rows (skip header)
        # Usually inside a table id="main-list-table" or similar class
        # But broadly searching all tr is safer as structure varies
        rows = soup.find_all('tr')
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) < 4:
                continue
            
            # Extract basic info (heuristic based on standard TDnet layout)
            # Col 0: Time, Col 1: Code, Col 2: Name, Col 3: Title
            try:
                code_text = cols[1].get_text().strip()
                name_text = cols[2].get_text().strip()
                title_text = cols[3].get_text().strip()
                
                # Check link
                pdf_link = None
                a_tag = cols[3].find('a')
                if a_tag:
                    pdf_link = "https://www.release.tdnet.info/inbs/" + a_tag['href']
                
                # Filter for "Upward Revision" or generally "Revision of Forecast"
                # Keywords: 業績予想の修正, 修正に関するお知らせ
                if "業績予想の修正" in title_text or "差異" in title_text:
                    ticker = code_text[:4] # 12340 -> 1234
                    
                    print(f"  Found Revision: {ticker} {name_text} - {title_text}")
                    
                    # Store in DB (MVP: Just the event, numbers need PDF parsing)
                    # We flag is_upward=NULL initially, logic needs to fill it later
                    # via XBRL usage or manual check or AI parsing
                    
                    # Use INSERT OR REPLACE to ensure title is updated if record exists
                    # Note: This might overwrite other fields if they changed, but for this use case it's fine.
                    # Or use UPSERT syntax (SQLite 3.24+)
                    
                    c.execute("""
                        INSERT INTO revisions 
                        (ticker, company_name, revision_date, source_url, quarter, title)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON CONFLICT(ticker, revision_date) DO UPDATE SET
                            title=excluded.title,
                            company_name=excluded.company_name,
                            source_url=excluded.source_url
                    """, (
                        ticker, 
                        name_text, 
                        target_date.strftime('%Y-%m-%d'),
                        pdf_link,
                        "Unknown",
                        title_text
                    ))
                    
                    if c.rowcount > 0:
                        count += 1
                        print(f"    -> New Revision Saved. Checking alerts...")
                        
                        # Check for Watchlist Matches (Alerts table)
                        # We select users who have this ticker in their alerts
                        # (Target Price doesn't matter for Revision alerts, imply pure watchlist)
                        # Or maybe we strictly follow "Alerts" logic?
                        # User logic: "Notification when revision comes for registered stock"
                        # -> Implies ANY registration.
                        
                        watchers = c.execute("""
                            SELECT u.id, u.line_user_id, u.email, u.email_notifications 
                            FROM alerts a
                            JOIN users u ON a.user_id = u.id
                            WHERE a.ticker = ? AND u.notify_revisions = 1
                        """, (ticker,)).fetchall()
                        
                        if watchers:
                            print(f"    -> Found {len(watchers)} watchers for {ticker}")
                            msg = f"🔔 【業績修正】\n{name_text} ({ticker})\n{title_text}\n{pdf_link or 'No Link'}\n\n詳細: https://rich-investor-news.com/revisions"
                            
                            from send_line import send_line_push
                            
                            for w in watchers:
                                # Send LINE
                                if w[1]: # line_user_id
                                    send_line_push(w[1], msg)
                                    
                                # Send Email (if enabled)
                                # (Optional, user focused on LINE mainly)
                        
                        # Stop generic broadcast to avoid spamming everyone for every revision
                        # Unless it's a "Super Important" one, but we don't know yet.
                        # Maybe broadcast only "Featured Investors" stocks?
                        # For now, disable generic broadcast.
                    
                    # count += 1 # Moved inside if block to only count new ones
            
            except Exception as e:
                # print(f"  Row parse error: {e}")
                continue
            
        conn.commit()
        conn.close()
        print(f"  Saved {count} revision events.")
        
    except Exception as e:
        print(f"Error fetching TDnet: {e}")

if __name__ == "__main__":
    # Test run: Fetch past 7 days to backfill
    today = datetime.datetime.now()
    for i in range(7):
        d = today - datetime.timedelta(days=i)
        fetch_tdnet_revisions(target_date=d)
        time.sleep(1) # Be nice to server
