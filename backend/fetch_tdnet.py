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

def fetch_tdnet_revisions(target_date=None, trigger_ai=True):
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
        # Find all rows (skip header)
        # Usually inside a table id="main-list-table" or similar class
        # But broadly searching all tr is safer as structure varies
        rows = soup.find_all('tr')
        print(f"  [DEBUG] Found {len(rows)} rows in HTML")
        
        for i, row in enumerate(rows):
            cols = row.find_all('td')
            if i < 3: # Debug first 3 rows
                 print(f"  [DEBUG] Row {i}: {len(cols)} columns. Content: {[c.get_text().strip()[:20] for c in cols]}")

            if len(cols) < 4:
                continue
            try:
                code_text = cols[1].get_text().strip()
                name_text = cols[2].get_text().strip()
                title_text = cols[3].get_text().strip()
                
                # Check link
                pdf_link = None
                a_tag = cols[3].find('a')
                if a_tag:
                    pdf_link = "https://www.release.tdnet.info/inbs/" + a_tag['href']
                
                # Filter for "Upward Revision", "Dividend Revision", "Buybacks", AND "Financial Results"
                # Keywords: 業績予想の修正, 修正に関するお知らせ, 配当, 剰余金の処分, 自己株式, 決算短信
                if any(k in title_text for k in ["業績予想の修正", "差異", "配当", "剰余金の処分", "自己株式", "決算短信"]):
                    # Refinement: Skip "Status Reports" (noise)
                    if "自己株式" in title_text and any(skip in title_text for skip in ["取得状況", "取得結果", "完了"]):
                        continue
                    ticker = code_text[:4] # 12340 -> 1234
                    
                    print(f"  Found Revision: {ticker} {name_text} - {title_text}")
                    
                    # Store in DB (MVP: Just the event, numbers need PDF parsing)
                    # We flag is_upward=NULL initially, logic needs to fill it later
                    # via XBRL usage or manual check or AI parsing
                    
                    # Use INSERT OR REPLACE to ensure title is updated if record exists
                    # Note: This might overwrite other fields if they changed, but for this use case it's fine.
                    # Or use UPSERT syntax (SQLite 3.24+)
                    
                    # Determine Category
                    category = 'general'
                    is_earnings = any(k in title_text for k in ['業績', '修正', '差異', '決算短信']) # Added Financial Results
                    is_dividend = any(k in title_text for k in ['配当', '剰余金'])
                    is_buyback = '自己株式' in title_text

                    if is_earnings and is_dividend:
                        category = 'both'
                    elif is_earnings:
                        category = 'earnings'
                    elif is_dividend:
                        category = 'dividend'
                    elif is_buyback:
                        category = 'buyback'

                    c.execute("""
                        INSERT INTO revisions 
                        (ticker, company_name, revision_date, source_url, quarter, title, category)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(ticker, revision_date) DO UPDATE SET
                            title=excluded.title,
                            company_name=excluded.company_name,
                            source_url=excluded.source_url,
                            category=excluded.category
                    """, (
                        ticker, 
                        name_text, 
                        target_date.strftime('%Y-%m-%d'),
                        pdf_link,
                        "Unknown",
                        title_text,
                        category
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
                        
                        # --- Post to X / LINE Logic MOVED to AI Analysis ---
                        # Previously we posted here based on keywords, but now we rely on AI result.
                        # This avoids "Generic Title" ignores and provides better context.
                        #
                        # The AI Analysis is triggered at the end of this script.
                        

                        # (Optional) We could still send LINE here if we want instant alerts for ALL?
                        # But let's unify to AI for quality control.
                        
                        # --- NEW: Auto-Add to Companies Master Table ---
                        # If a company is in TDnet, it should be searchable.
                        # This progressively heals the 'companies' table for missing tickers.
                        try:
                            c.execute("""
                                INSERT INTO companies (ticker, name, market, sector, created_at)
                                VALUES (?, ?, 'TDnet', '', CURRENT_TIMESTAMP)
                                ON CONFLICT(ticker) DO UPDATE SET
                                    name=excluded.name,
                                    market=excluded.market
                            """, (ticker, name_text))
                            # print(f"    -> Updated companies master for {ticker}")
                        except Exception as e_comp:
                            print(f"    Warning: Could not auto-add to companies table: {e_comp}")

                        pass

                    # count += 1 
            
            except Exception as e:
                # print(f"  Row parse error: {e}")
                continue 
            
            except Exception as e:
                # print(f"  Row parse error: {e}")
                continue
            
        conn.commit()
        conn.close()
        print(f"  Saved {count} revision events.")

        # --- Trigger AI Analysis ---
        if trigger_ai:
            try:
                from analyze_revisions_ai import process_revisions
                print("--- Starting AI Analysis for new revisions ---")
                process_revisions()
                print("--- AI Analysis Completed ---")
            except Exception as e:
                print(f"Error during AI Analysis trigger: {e}")
        
    except Exception as e:
        print(f"Error fetching TDnet: {e}")

if __name__ == "__main__":
    # Test run: Fetch past 7 days to backfill
    today = datetime.datetime.now()
    # Fetch past 7 days, but ONLY trigger AI once at the very end
    for i in range(7):
        d = today - datetime.timedelta(days=i)
        fetch_tdnet_revisions(target_date=d, trigger_ai=False)
        time.sleep(1) # Be nice to server

    # Trigger AI once after all data is fetched
    print("\nBatch fetch complete. Triggering AI Analysis...")
    from analyze_revisions_ai import process_revisions
    process_revisions()
